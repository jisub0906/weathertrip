import { connectToDatabase } from '../../../lib/mongodb';


export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { limit = 10, page = 1 } = req.query;

    // 최근 리뷰 조회 (관광지 정보와 함께)
    const reviews = await db.collection('reviews')
      .aggregate([
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: (parseInt(page) - 1) * parseInt(limit)
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

    // 전체 리뷰 수 조회
    const totalReviews = await db.collection('reviews').countDocuments();

    return res.status(200).json({
      reviews,
      pagination: {
        total: totalReviews,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalReviews / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('최근 리뷰 조회 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
} 