import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  await dbConnect();

  try {
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

    console.log('💬 받은 데이터:', req.body);

    // 필수 항목 확인
    if (!name || !email || !password || !nickname || !phone) {
      return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' });
    }

    // 사용자 데이터 정리
    const userData = {
      name,
      email,
      password,
      nickname,
      phone
    };

    if (gender) userData.gender = gender;
    if (birthdate) userData.birthdate = birthdate;

    if (region?.country) {
      userData.region = {
        country: region.country,
        ...(region.city && { city: region.city })
      };
    }

    // 유저 생성 시도
    const newUser = await User.create(userData);

    return res.status(201).json({
      message: '회원가입 되었습니다.',
      userId: newUser._id
    });

  } catch (error) {
    console.error('회원가입 오류:', error.message, error?.errors ?? error);

    // 중복 필드 에러 처리
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern)[0];

      if (duplicatedField === 'nickname') {
        return res.status(409).json({
          message: '이미 사용 중인 닉네임입니다.'
        });
      }

      // 이메일 또는 전화번호 중복 → 개인정보 보호를 위해 통합 메시지
      if (['email', 'phone'].includes(duplicatedField)) {
        return res.status(409).json({
          message: '이미 가입된 이메일 또는 전화번호입니다.'
        });
      }

      return res.status(409).json({
        message: '중복된 항목이 있습니다.'
      });
    }

    // 기타 서버 오류
    return res.status(500).json({
      message: '서버 오류입니다.'
    });
  }
}
