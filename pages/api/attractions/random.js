import { getDatabase } from '../../../lib/db/mongodb';

// 캐시 설정
const CACHE_DURATION = 5 * 60 * 1000; // 5분
let cache = {
  data: null,
  timestamp: null
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { limit = 10 } = req.query;
    const now = Date.now();

    // 캐시된 데이터가 있고 만료되지 않았다면 캐시된 데이터 반환
    if (cache.data && cache.timestamp && (now - cache.timestamp < CACHE_DURATION)) {
      return res.status(200).json({
        count: cache.data.length,
        attractions: cache.data
      });
    }

    const db = await getDatabase();
    const attractions = db.collection('attractions');

    // 이미지가 있는 관광지 중에서 랜덤으로 선택
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
    console.error('랜덤 관광지 조회 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
} 