import { connectToDatabase } from '../../../lib/db/mongodb';

/**
 * 최근 관광지 리뷰 목록 조회 API 라우트 핸들러
 * - GET: 최신순 리뷰 목록(관광지/유저 정보 포함, 페이지네이션 지원)
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(리뷰 배열, 페이지네이션 정보)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // DB 연결 및 컬렉션 참조
    const { db } = await connectToDatabase();
    const { 
      limit = 10, 
      lastTimestamp,
      lastId 
    } = req.query;

    /**
     * 페이지네이션을 위한 쿼리 조건 생성
     * - lastTimestamp, lastId가 있으면 해당 시점 이후 데이터만 조회
     */
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

    /**
     * MongoDB Aggregation Pipeline
     * - 최신순 정렬, 관광지/유저 정보 조인, 필요한 필드만 반환
     */
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
            'user.nickname': 1,
            'user.profileImage': 1
          }
        }
      ])
      .toArray();

    // 전체 리뷰 수 조회(페이지네이션 정보에 활용)
    const totalReviews = await db.collection('reviews')
      .estimatedDocumentCount();

    // 다음 페이지 존재 여부 및 마지막 리뷰 정보 계산
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
    // DB/서버 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
} 