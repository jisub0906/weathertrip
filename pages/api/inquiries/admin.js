import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * 관리자 문의 목록 조회 API 라우트 핸들러
 * - GET: 다양한 필터(타입, 위치, 상태, 이메일)로 문의 목록 조회 (관리자만 접근 가능)
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(문의 목록)
 */
export default withErrorHandler(async (req, res) => {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  // 관리자 인증(JWT 토큰)
  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
  }

  // 쿼리 파라미터 추출 및 필터 객체 생성
  const { type, locationId, status, email } = req.query;
  const filter = {};

  // 문의 유형 필터링(일반/관광지)
  if (type === 'general' || type === 'tourist') {
    filter.targetType = type;
  }

  // 특정 관광지 문의 필터링
  if (locationId) {
    filter.attractionId = toObjectId(locationId);
  }

  // 문의 상태(대기/답변완료) 필터링
  if (status === 'pending' || status === 'answered') {
    filter.status = status;
  }

  // 이메일로 문의 필터링
  if (email?.trim()) {
    filter.email = email.trim();
  }

  // 문의 목록 조회(최신순)
  const inquiries = await getCollection('inquiries');
  const results = await inquiries.find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return res.status(200).json({ inquiries: results });
});