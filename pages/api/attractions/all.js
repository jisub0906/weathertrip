import { getDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const db = await getDatabase();
    const attractions = db.collection('attractions');
    
    // 결과 제한 - 기본값은 100개
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    console.log(`모든 관광지 요청: 최대 ${limit}개`);
    
    // 모든 관광지 가져오기 (검색 반경 없이)
    const results = await attractions.find({})
      .limit(limit)
      .toArray();
    
    console.log(`검색 결과: ${results.length}개 관광지 찾음`);
    
    return res.status(200).json({
      count: results.length,
      attractions: results
    });
  } catch (error) {
    console.error('관광지 검색 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.stack });
  }
} 