import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다.');
    }

    console.log('MongoDB 연결 시도 중...');
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');

    const db = client.db('weather-trip');
    console.log('데이터베이스 연결 성공');

    const questions = await db.collection('quiz').find().toArray();
    console.log('퀴즈 데이터 조회 성공:', questions.length, '개의 문제');

    client.close();
    console.log('MongoDB 연결 종료');

    return res.status(200).json(questions);
  } catch (error) {
    console.error('MongoDB 에러 상세:', {
      message: error.message,
      stack: error.stack,
      uri: process.env.MONGODB_URI ? '설정됨' : '설정되지 않음'
    });
    return res.status(500).json({ 
      message: '퀴즈 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
} 