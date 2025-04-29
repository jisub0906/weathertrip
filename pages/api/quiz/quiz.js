import { MongoClient } from 'mongodb';

/**
 * 퀴즈 문제 목록 조회 API 라우트 핸들러
 * - GET: 전체 퀴즈 문제를 MongoDB에서 조회하여 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 배열(퀴즈 문제 목록) 또는 에러 메시지
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // MongoDB 연결 환경 변수 확인
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다.');
    }

    // MongoDB 클라이언트 연결
    const client = await MongoClient.connect(process.env.MONGODB_URI);

    // weather-trip 데이터베이스 참조
    const db = client.db('weather-trip');

    // quiz 컬렉션에서 모든 퀴즈 문제 조회
    const questions = await db.collection('quiz').find().toArray();

    // 연결 종료(리소스 누수 방지)
    client.close();

    return res.status(200).json(questions);
  } catch (error) {
    // DB 연결 또는 쿼리 실패 시 에러 처리
    return res.status(500).json({ 
      message: '퀴즈 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
} 