import { connectToDatabase } from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    // 1️⃣ 로그인된 사용자 토큰 확인 (JWT 기반)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    // 2️⃣ DB 연결
    const { db } = await connectToDatabase();

    // 3️⃣ 사용자 조회 (ObjectId 변환)
    const user = await db.collection('users').findOne({ _id: new ObjectId(token.id) });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 4️⃣ 응답: 비밀번호 제외한 유저 정보 반환
    const { password, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (error) {
    // 5️⃣ 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}