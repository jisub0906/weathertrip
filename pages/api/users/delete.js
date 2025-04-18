import { connectToDatabase } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const { email, password } = req.body;

  try {
    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(token.id) },
      { projection: { email: 1, password: 1 } } // ✅ password 포함되도록 명시
    );

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    if (user.email !== email) {
      return res.status(400).json({ message: '이메일이 일치하지 않습니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    await db.collection('users').deleteOne({ _id: new ObjectId(token.id) });

    return res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (err) {
    console.error('탈퇴 오류:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
