import { connectToDatabase } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * 사용자 정보(비밀번호) 수정 API 라우트 핸들러
 * - PUT: 인증된 사용자가 본인 비밀번호를 변경할 수 있음
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(업데이트된 사용자 정보, 비밀번호 제외)
 */
export default async function handler(req, res) {
  // PUT 메서드만 허용
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  // JWT 토큰 인증 및 사용자 ID 추출
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  // 요청 본문에서 비밀번호 추출
  const { password } = req.body;

  try {
    // DB 연결
    const { db } = await connectToDatabase();

    // 업데이트할 필드 객체 준비
    const updateFields = {};

    // 비밀번호 변경 요청이 있는 경우(새 비밀번호 입력)
    if (password && password.trim() !== '') {
      // 새 비밀번호 해싱 후 저장
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    } else {
      // 비밀번호 입력이 없는 경우, 기존 비밀번호 유지
      const existing = await db.collection('users').findOne({ _id: new ObjectId(token.id) });
      if (existing && existing.password) {
        updateFields.password = existing.password;
      }
    }

    // 사용자 정보 업데이트(비밀번호만 변경)
    await db.collection('users').updateOne(
      { _id: new ObjectId(token.id) },
      { $set: updateFields }
    );

    // 업데이트된 사용자 정보 조회(비밀번호 제외)
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(token.id) });
    const { password: pw, ...safeUser } = updatedUser;

    return res.status(200).json(safeUser);
  } catch (err) {
    // 서버 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}