import { connectToDatabase } from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getToken } from 'next-auth/jwt';

/**
 * 마이페이지(내 정보 조회) API 라우트 핸들러
 * - GET: 인증된 사용자가 본인 정보를 조회할 수 있음(비밀번호 제외)
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(사용자 정보, 비밀번호 제외)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    // JWT 토큰 인증 및 사용자 ID 추출
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    // DB 연결
    const { db } = await connectToDatabase();

    // 사용자 정보 조회(ObjectId 변환)
    const user = await db.collection('users').findOne({ _id: new ObjectId(token.id) });

    // 사용자가 존재하지 않으면 에러 반환
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호를 제외한 사용자 정보만 반환
    const { password, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (error) {
    // 서버 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}