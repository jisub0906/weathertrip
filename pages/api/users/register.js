import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  await dbConnect();

  try {
    // ✅ 모든 필드 받아오기
    const {
      name,
      email,
      password,
      nickname,
      gender,
      birthdate,
      phone,
      region
    } = req.body;

    // ✅ 간단한 유효성 검사
    if (!name || !email || !password || !nickname || !gender || !phone) {
      return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
    }

    // ✅ 유저 생성
    const newUser = await User.create({
      name,
      email,
      password,
      nickname,
      gender,
      birthdate,
      phone,
      region
    });

    return res.status(201).json({ message: '회원가입 되었습니다.', userId: newUser._id });

  } catch (error) {
    console.error('회원가입 오류:', error);

    // ✅ 중복 에러 구분 처리
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern)[0];

      if (['email', 'phone'].includes(duplicatedField)) {
        return res.status(409).json({ message: '이미 가입된 이메일이거나 전화번호입니다.' });
      }

      if (duplicatedField === 'nickname') {
        return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
      }

      return res.status(409).json({ message: '중복된 항목이 있습니다.' });
    }

    return res.status(500).json({ message: '서버 오류입니다.' });
  }
}