import { connectToDatabase } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const { password } = req.body;

  try {
    const { db } = await connectToDatabase();

    const updateFields = {};

    // 1️⃣ 비밀번호 변경 요청이 있는 경우
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    } else {
      // 2️⃣ 비밀번호 입력이 없는 경우, 기존 비밀번호 유지
      const existing = await db.collection('users').findOne({ _id: new ObjectId(token.id) });
      if (existing && existing.password) {
        updateFields.password = existing.password;
      }
    }

    // 3️⃣ 사용자 정보 업데이트
    await db.collection('users').updateOne(
      { _id: new ObjectId(token.id) },
      { $set: updateFields }
    );

    // 4️⃣ 업데이트된 사용자 정보 반환 (비밀번호 제외)
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(token.id) });
    const { password: pw, ...safeUser } = updatedUser;

    return res.status(200).json(safeUser);
  } catch (err) {
    // 5️⃣ 오류 처리
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}