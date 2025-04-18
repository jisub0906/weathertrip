import { connectToDatabase } from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    // 1. 로그인된 사용자 정보 가져오기 (JWT 기반)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('✅ 현재 토큰:', token);

    if (!token || !token.id) {
      console.log('❌ 로그인된 유저 없음 or token.id 없음');
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    // 2. DB 연결
    const { db } = await connectToDatabase();

    // 3. ObjectId 변환 및 유저 정보 조회
    let user;
    try {
      user = await db.collection('users').findOne({ _id: new ObjectId(token.id) });
    } catch (error) {
      console.log('❌ ObjectId 변환 실패:', error);
      return res.status(400).json({ message: '잘못된 사용자 ID 형식입니다.' });
    }

    if (!user) {
      console.log('❌ 유저 정보 없음');
      return res.status(404).json({ message: '유저 정보를 찾을 수 없습니다.' });
    }

    // 4. 응답: 비밀번호 제외한 유저 정보 반환
    const { password, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (error) {
    console.error('💥 마이페이지 조회 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
