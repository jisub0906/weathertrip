import { connectToDatabase } from '../../../lib/db/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { 
      limit = 10, 
      lastTimestamp,
      lastId 
    } = req.query;

    // 쿼리 조건 설정
    let query = {};
    if (lastTimestamp && lastId) {
      query = {
        $or: [
          { createdAt: { $lt: new Date(lastTimestamp) } },
          {
            createdAt: new Date(lastTimestamp),
            _id: { $lt: lastId }
          }
        ]
      };
    }

    // 최근 리뷰 조회 (관광지 정보와 함께)
    const reviews = await db.collection('reviews')
      .aggregate([
        {
          $match: query
        },
        {
          $sort: { 
            createdAt: -1,
            _id: -1  // 같은 시간에 생성된 리뷰들도 순서 보장
          }
        },
        {
          $limit: parseInt(limit)
        },
        {
          $lookup: {
            from: 'attractions',
            localField: 'attractionId',
            foreignField: '_id',
            as: 'attraction'
          }
        },
        {
          $unwind: '$attraction'
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
            rating: 1,
            images: 1,
            createdAt: 1,
            'attraction._id': 1,
            'attraction.name': 1,
            'attraction.images': 1,
            'user._id': 1,
            'user.name': 1,
            'user.profileImage': 1
          }
        }
      ])
      .toArray();

    // 전체 리뷰 수 조회 (캐시 활용)
    const totalReviews = await db.collection('reviews')
      .estimatedDocumentCount();

    // 다음 페이지 존재 여부 확인
    const hasNextPage = reviews.length === parseInt(limit);
    const lastReview = reviews[reviews.length - 1];

    return res.status(200).json({
      reviews,
      pagination: {
        hasNextPage,
        lastTimestamp: lastReview?.createdAt,
        lastId: lastReview?._id,
        total: totalReviews
      }
    });
  } catch (error) {
    console.error('최근 리뷰 조회 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
} 