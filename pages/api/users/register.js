import { User } from '../../../models/User';
import { withErrorHandler, validationError, duplicateError } from '../../../lib/middlewares/errorHandler';
import bcrypt from 'bcryptjs';

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
    confirmPassword,
    nickname,
    gender,
    birthdate,
    phone
  } = req.body;

  // 1️⃣ 필수값 체크
  const missingFields = {};
  if (!name) missingFields.name = true;
  if (!email) missingFields.email = true;
  if (!password) missingFields.password = true;
  if (!confirmPassword) missingFields.confirmPassword = true;
  if (!nickname) missingFields.nickname = true;
  if (!phone) missingFields.phone = true;

  if (Object.keys(missingFields).length > 0) {
    return validationError(res, '필수 항목을 모두 입력해주세요.', missingFields);
  }

  // 2️⃣ 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return validationError(res, '유효하지 않은 이메일 형식입니다.', { email: true });
  }

  // 3️⃣ 비밀번호 복잡성 검증
  if (password.length < 8) {
    return validationError(res, '비밀번호는 최소 8자리 이상이어야 합니다.', { password: true });
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return validationError(res, '비밀번호는 소문자를 포함해야 합니다.', { password: true });
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return validationError(res, '비밀번호는 대문자를 포함해야 합니다.', { password: true });
  }
  if (!/(?=.*\d)/.test(password)) {
    return validationError(res, '비밀번호는 숫자를 포함해야 합니다.', { password: true });
  }
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    return validationError(res, '비밀번호는 특수문자(!@#$%^&*)를 포함해야 합니다.', { password: true });
  }

  // 4️⃣ 비밀번호 일치 여부
  if (password !== confirmPassword) {
    return validationError(res, '비밀번호가 일치하지 않습니다.', { confirmPassword: true });
  }

  // 5️⃣ 닉네임 검증
  if (nickname.length < 1) {
    return validationError(res, '닉네임은 최소 1글자 이상이어야 합니다.', { nickname: true });
  }
  if (/^\d/.test(nickname)) {
    return validationError(res, '닉네임은 숫자로 시작할 수 없습니다.', { nickname: true });
  }

  // 6️⃣ 전화번호 검증
  if (!User.validatePhone(phone)) {
    return validationError(res, '유효하지 않은 전화번호 형식입니다.', { phone: true });
  }

  try {
    // 7️⃣ 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8️⃣ 사용자 생성
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      nickname,
      gender,
      birthdate,
      phone,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 9️⃣ 성공 응답
    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nickname: user.nickname
      }
    });
  } catch (error) {
    // 🔟 오류 처리
    if (error.message.includes('이미 사용 중인')) {
      return duplicateError(res, error.message);
    }
    return res.status(500).json({
      message: '회원가입 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

export default withErrorHandler(registerHandler);