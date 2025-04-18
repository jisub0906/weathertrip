import { connectToDatabase } from '../../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: '관광지 ID가 필요합니다.' });
  }

  try {
    const { db } = await connectToDatabase();
    let attractionId;

    try {
      attractionId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: '유효하지 않은 관광지 ID입니다.' });
    }

    switch (method) {
      case 'GET':
        // 특정 관광지의 리뷰 목록 조회 (사용자 정보 포함)
        const reviews = await db.collection('reviews')
          .aggregate([
            {
              $match: { attractionId }
            },
            {
              $sort: { createdAt: -1 }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
              }
            },
            {
              $unwind: '$user'
            },
            {
              $project: {
                _id: 1,
                content: 1,
                images: 1,
                createdAt: 1,
                'user._id': 1,
                'user.name': 1,
                'user.profileImage': 1
              }
            }
          ])
          .toArray();
        
        return res.status(200).json({ reviews });

      case 'POST':
        // 새 리뷰 작성
        const { userId, content, images } = req.body;

        if (!userId || !content) {
          return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
        }

        let userIdObj;
        try {
          userIdObj = new ObjectId(userId);
        } catch (error) {
          return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
        }

        const newReview = {
          attractionId,
          userId: userIdObj,
          content,
          images: images || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('reviews').insertOne(newReview);

        return res.status(201).json({ 
          message: '리뷰가 성공적으로 작성되었습니다.',
          review: { ...newReview, _id: result.insertedId }
        });

      case 'PUT':
        // 리뷰 수정
        const { reviewId, updatedContent, updatedImages } = req.body;

        if (!reviewId) {
          return res.status(400).json({ message: '리뷰 ID가 필요합니다.' });
        }

        let reviewIdObj;
        try {
          reviewIdObj = new ObjectId(reviewId);
        } catch (error) {
          return res.status(400).json({ message: '유효하지 않은 리뷰 ID입니다.' });
        }

        const updateData = {
          updatedAt: new Date()
        };

        if (updatedContent) updateData.content = updatedContent;
        if (updatedImages) updateData.images = updatedImages;

        await db.collection('reviews').updateOne(
          { _id: reviewIdObj },
          { $set: updateData }
        );

        return res.status(200).json({ message: '리뷰가 성공적으로 수정되었습니다.' });

      case 'DELETE':
        // 리뷰 삭제
        const { reviewId: deleteReviewId } = req.body;

        if (!deleteReviewId) {
          return res.status(400).json({ message: '리뷰 ID가 필요합니다.' });
        }

        let deleteReviewIdObj;
        try {
          deleteReviewIdObj = new ObjectId(deleteReviewId);
        } catch (error) {
          return res.status(400).json({ message: '유효하지 않은 리뷰 ID입니다.' });
        }

        await db.collection('reviews').deleteOne({ _id: deleteReviewIdObj });

        return res.status(200).json({ message: '리뷰가 성공적으로 삭제되었습니다.' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('리뷰 API 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
} 