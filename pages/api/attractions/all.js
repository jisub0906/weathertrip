import { getDatabase } from '../../../lib/db/mongodb';

/**
 * 전체 관광지 목록 조회 API 라우트 핸들러
 * - GET: DB에 저장된 모든 관광지 데이터를 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(관광지 배열, 총 개수)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    // DB 연결 및 컬렉션 참조
    const db = await getDatabase();
    const attractions = db.collection('attractions');
    
    // 모든 관광지 가져오기 (제한 없이)
    const results = await attractions.find({}).toArray();
    
    return res.status(200).json({
      count: results.length,
      attractions: results
    });
  } catch (error) {
    // DB/서버 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.stack });
  }
} 