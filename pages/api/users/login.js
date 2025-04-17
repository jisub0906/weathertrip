// pages/api/users/login.js
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 요청입니다.' });
  }

  await dbConnect();

  const { email, password } = req.body;

  // 1️⃣ 필수값 체크
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' });
  }

  try {
    // 2️⃣ 사용자 찾기
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({
        message: '이메일 또는 비밀번호가 틀렸습니다.',
      });
    }

    // 4️⃣ 로그인 성공
    return res.status(200).json({
      message: '로그인 성공',
      user: {
        name: user.name,
        email: user.email,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
