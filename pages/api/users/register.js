// pages/api/users/register.js
import { User } from '../../../models/User';
import { withErrorHandler, validationError, duplicateError } from '../../../lib/middlewares/errorHandler';

async function registerHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: '허용되지 않는 메서드입니다.',
      error: 'method_not_allowed',
      status: 405
    });
  }

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

  console.log('회원가입 요청 데이터:', { 
    name, 
    email, 
    nickname, 
    phone,
    gender,
    birthdate,
    region
  });

  // 1️⃣ 필수값 체크
  const missingFields = {};
  if (!name) missingFields.name = true;
  if (!email) missingFields.email = true;
  if (!password) missingFields.password = true;
  if (!nickname) missingFields.nickname = true;
  if (!phone) missingFields.phone = true;

  if (Object.keys(missingFields).length > 0) {
    console.log('필수값 누락:', missingFields);
    return validationError(res, '필수 항목을 모두 입력해주세요.', missingFields);
  }

  // 2️⃣ 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('이메일 형식 오류:', email);
    return validationError(res, '유효하지 않은 이메일 형식입니다.', { email: true });
  }

  // 3️⃣ 비밀번호 길이 검증
  if (password.length < 4) {
    console.log('비밀번호 길이 오류:', password.length);
    return validationError(res, '비밀번호는 최소 4자리 이상이어야 합니다.', { password: true });
  }

  // 4️⃣ 닉네임 형식 검증
  if (nickname.length < 1) {
    console.log('닉네임 길이 오류:', nickname);
    return validationError(res, '닉네임은 최소 1글자 이상이어야 합니다.', { nickname: true });
  }

  if (/^\d/.test(nickname)) {
    console.log('닉네임 숫자 시작 오류:', nickname);
    return validationError(res, '닉네임은 숫자로 시작할 수 없습니다.', { nickname: true });
  }

  try {
    // 5️⃣ 이메일 중복 체크
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      console.log('이메일 중복:', email);
      return duplicateError(res, '이미 가입된 이메일입니다.', 'email');
    }

    // 6️⃣ 닉네임 중복 체크
    const existingNickname = await User.findByNickname(nickname);
    if (existingNickname) {
      console.log('닉네임 중복:', nickname);
      return duplicateError(res, '이미 사용 중인 닉네임입니다.', 'nickname');
    }

    // 7️⃣ 전화번호 유효성 검사
    const isValidPhone = User.validatePhone(phone);
    if (!isValidPhone) {
      console.log('전화번호 형식 오류:', phone);
      return validationError(res, '전화번호 형식이 올바르지 않습니다.', { phone: true });
    }

    // 8️⃣ 도시 유효성 검사
    if (region?.city) {
      const isValidCity = User.validateCity(region.city);
      if (!isValidCity) {
        console.log('도시 유효성 오류:', region.city);
        return validationError(res, '유효하지 않은 도시입니다.', { 'region.city': true });
      }
    }

    // 9️⃣ 사용자 데이터 구성
    const userData = {
      name,
      email,
      password,
      nickname,
      phone,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (typeof gender === 'string' && gender.trim() !== '') {
      userData.gender = gender;
    }

    if (birthdate) {
      userData.birthdate = new Date(birthdate);
    }

    if (region?.country) {
      userData.region = {
        country: region.country,
        ...(region.city && { city: region.city })
      };
    }

    console.log('생성할 사용자 데이터:', {
      ...userData,
      password: '비밀번호는 숨김'
    });

    // 🔟 사용자 생성
    const userId = await User.create(userData);
    console.log('사용자 생성 성공:', userId);

    return res.status(201).json({
      message: '회원가입 되었습니다.',
      userId
    });
  } catch (error) {
    // withErrorHandler 미들웨어에서 처리
    throw error;
  }
}

// 에러 핸들링 미들웨어 적용
export default withErrorHandler(registerHandler);