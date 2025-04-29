import { User } from '../../../models/User';
import { withErrorHandler, validationError, duplicateError } from '../../../lib/middlewares/errorHandler';
import bcrypt from 'bcryptjs';

/**
 * 회원가입 API 라우트 핸들러
 * - POST: 사용자 회원가입 요청을 처리하고, 입력값 검증 및 중복 체크, 비밀번호 해싱, 사용자 생성까지 수행
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(회원가입 결과 및 생성된 사용자 정보)
 */
async function registerHandler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: '허용되지 않는 메서드입니다.',
      error: 'method_not_allowed',
      status: 405
    });
  }

  // 요청 본문에서 회원가입 정보 추출
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

  // 필수값 누락 체크
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

  // 이메일 형식 검증(정규식)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return validationError(res, '유효하지 않은 이메일 형식입니다.', { email: true });
  }

  // 비밀번호 복잡성 검증(길이, 소문자, 대문자, 숫자, 특수문자)
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

  // 비밀번호/확인 비밀번호 일치 여부
  if (password !== confirmPassword) {
    return validationError(res, '비밀번호가 일치하지 않습니다.', { confirmPassword: true });
  }

  // 닉네임 검증(길이, 숫자 시작 불가)
  if (nickname.length < 1) {
    return validationError(res, '닉네임은 최소 1글자 이상이어야 합니다.', { nickname: true });
  }
  if (/^\d/.test(nickname)) {
    return validationError(res, '닉네임은 숫자로 시작할 수 없습니다.', { nickname: true });
  }

  // 전화번호 형식 검증(유틸 함수 활용)
  if (!User.validatePhone(phone)) {
    return validationError(res, '유효하지 않은 전화번호 형식입니다.', { phone: true });
  }

  try {
    // 비밀번호 해싱(보안)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성(DB 저장)
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

    // 회원가입 성공 응답(중요 정보만 반환)
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
    // 중복 에러 및 기타 서버 오류 처리
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