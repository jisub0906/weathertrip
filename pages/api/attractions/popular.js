import { getDatabase } from '../../../lib/db/mongodb';

/**
 * 인기 관광지 목록 조회 API 라우트 핸들러
 * - GET: 좋아요(likes) 수 기준으로 인기 관광지 상위 N개 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(인기 관광지 배열, 총 개수)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  try {
    // DB 및 컬렉션 참조
    const db = await getDatabase();
    const attractions = db.collection('attractions');
    const likes = db.collection('likes');
    
    // 쿼리 파라미터로 인기 관광지 개수 제한(기본 10개)
    const limit = parseInt(req.query.limit) || 10;
    
    /**
     * MongoDB Aggregation Pipeline
     * - 각 관광지별로 likes 컬렉션과 조인하여 likeCount 필드 추가
     * - 좋아요 1개 이상인 관광지만 추출, likeCount 내림차순 정렬, limit 적용
     * - likes 배열은 반환하지 않음
     */
    const popularAttractions = await attractions
      .aggregate([
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'attractionId',
            as: 'likes'
          }
        },
        {
          $addFields: {
            likeCount: { $size: '$likes' }
          }
        },
        {
          $match: {
            likeCount: { $gt: 0 }
          }
        },
        {
          $sort: { likeCount: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            likes: 0
          }
        }
      ])
      .toArray();

    if (!popularAttractions || popularAttractions.length === 0) {
      // 인기 관광지가 없을 때 빈 배열 반환
      return res.status(200).json({
        success: true,
        data: {
          attractions: [],
          total: 0
        },
        message: '인기 관광지가 아직 없습니다.'
      });
    }

    // 인기 관광지 목록 반환
    res.status(200).json({
      success: true,
      data: {
        attractions: popularAttractions,
        total: popularAttractions.length
      }
    });
  } catch (error) {
    // DB/서버 오류 처리
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
} 