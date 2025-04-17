// pages/api/users/login.js
import { User } from '../../../models/User';
import { withErrorHandler, validationError, authError } from '../../../lib/middlewares/errorHandler';

async function loginHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: '허용되지 않은 요청입니다.',
      error: 'method_not_allowed',
      status: 405
    });
  }

  const { email, password } = req.body;

  console.log('로그인 요청:', { email, password: password ? '제공됨' : '없음' });

  // 1️⃣ 필수값 체크
  const missingFields = {};
  if (!email) missingFields.email = true;
  if (!password) missingFields.password = true;

  if (Object.keys(missingFields).length > 0) {
    console.log('필수값 누락:', missingFields);
    return validationError(res, '이메일과 비밀번호를 모두 입력해주세요.', missingFields);
  }

  try {
    // 2️⃣ 사용자 찾기
    const user = await User.findByEmail(email);
    console.log('사용자 정보:', user ? {
      email: user.email,
      password: user.password ? '제공됨' : '없음'
    } : '사용자 없음');

    if (!user) {
      console.log('사용자 없음:', email);
      return authError(res, '이메일 또는 비밀번호가 틀렸습니다.');
    }

    // 3️⃣ 비밀번호 확인
    if (!user.password || typeof user.password !== 'string') {
      console.log('비밀번호 데이터 오류:', email);
      return authError(res, '계정에 문제가 있습니다. 관리자에게 문의하세요.');
    }

    if (user.password !== password) {
      console.log('비밀번호 불일치');
      return authError(res, '이메일 또는 비밀번호가 틀렸습니다.');
    }

    // 4️⃣ 로그인 성공
    const { password: _, ...userWithoutPassword } = user;
    console.log('로그인 성공:', {
      email: userWithoutPassword.email,
      name: userWithoutPassword.name
    });
    
    return res.status(200).json({
      message: '로그인 성공',
      user: userWithoutPassword
    });
  } catch (error) {
    // withErrorHandler 미들웨어에서 처리
    throw error;
  }
}

// 에러 핸들링 미들웨어 적용
export default withErrorHandler(loginHandler);