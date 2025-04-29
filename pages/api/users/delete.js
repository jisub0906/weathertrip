import { connectToDatabase } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * 회원 탈퇴(사용자 삭제) API 라우트 핸들러
 * - POST: 인증된 사용자가 본인 계정을 삭제(탈퇴)할 수 있음
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(탈퇴 결과 메시지)
 */
export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  // JWT 토큰 인증 및 사용자 ID 추출
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  // 요청 본문에서 이메일, 비밀번호 추출
  const { email, password } = req.body;

  try {
    // DB 연결
    const { db } = await connectToDatabase();

    // 사용자 조회(비밀번호 포함) - 본인 확인 목적
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(token.id) },
      { projection: { email: 1, password: 1 } }
    );

    // 사용자가 존재하지 않으면 에러 반환
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 이메일 일치 여부 확인(본인 확인)
    if (user.email !== email) {
      return res.status(400).json({ message: '이메일이 일치하지 않습니다.' });
    }

    // 비밀번호 일치 여부 확인(본인 확인)
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 사용자 삭제(회원 탈퇴)
    await db.collection('users').deleteOne({ _id: new ObjectId(token.id) });

    return res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (err) {
    // 서버 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}