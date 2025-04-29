import { getDatabase } from '../../../lib/db/mongodb';

/**
 * 랜덤 관광지 목록 조회 API 라우트 핸들러
 * - GET: 이미지가 있는 관광지 중 랜덤 N개 반환(5분 캐시)
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(관광지 배열, 총 개수)
 */
// 캐시 설정(5분)
const CACHE_DURATION = 5 * 60 * 1000;
let cache = {
  data: null,
  timestamp: null
};

export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    // 쿼리 파라미터에서 limit 추출(기본 10)
    const { limit = 10 } = req.query;
    const now = Date.now();

    /**
     * 캐시된 데이터가 있고 만료되지 않았다면 캐시된 데이터 반환
     * - DB 부하 감소 및 응답 속도 개선
     */
    if (cache.data && cache.timestamp && (now - cache.timestamp < CACHE_DURATION)) {
      return res.status(200).json({
        count: cache.data.length,
        attractions: cache.data
      });
    }

    // DB 연결 및 컬렉션 참조
    const db = await getDatabase();
    const attractions = db.collection('attractions');

    /**
     * MongoDB Aggregation Pipeline
     * - 이미지가 있는 관광지만 필터링
     * - 랜덤 샘플링($sample)
     * - 첫 번째 이미지만 반환
     */
    const pipeline = [
      {
        $match: {
          images: { $exists: true, $ne: [] }
        }
      },
      {
        $sample: { size: parseInt(limit) }
      },
      {
        $project: {
          name: 1,
          address: 1,
          images: { $slice: ['$images', 1] }, // 첫 번째 이미지만 선택
          description: 1,
          location: 1
        }
      }
    ];

    const results = await attractions.aggregate(pipeline).toArray();

    // 결과를 캐시에 저장
    cache = {
      data: results,
      timestamp: now
    };

    return res.status(200).json({
      count: results.length,
      attractions: results
    });
  } catch (error) {
    // DB/서버 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
} 