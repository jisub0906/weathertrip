import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler, authError } from '../../../lib/middlewares/errorHandler';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * 문의 단일 삭제 API 라우트 핸들러
 * - DELETE: 작성자 또는 관리자가 해당 문의를 삭제할 수 있음
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(삭제 결과 메시지)
 */
export default withErrorHandler(async (req, res) => {
  // inquiries 컬렉션 참조
  const inquiries = await getCollection('inquiries');
  const id = req.query.id;

  // DELETE - 작성자 또는 관리자만 삭제 가능
  if (req.method === 'DELETE') {
    // JWT 토큰에서 사용자 정보 추출
    const token = await getToken({ req, secret });
    if (!token) return authError(res, '로그인이 필요합니다.');

    // 삭제 대상 문의 조회
    const inquiry = await inquiries.findOne({ _id: toObjectId(id) });
    if (!inquiry) return res.status(404).json({ message: '문의가 존재하지 않습니다.' });

    // 삭제 권한 확인: 작성자 또는 관리자만 가능
    const isOwner = inquiry.email === token.email;
    const isAdmin = token.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    // 실제 삭제 수행
    await inquiries.deleteOne({ _id: toObjectId(id) });
    return res.status(200).json({ message: '삭제되었습니다.' });
  }

  // 허용되지 않은 메서드 처리
  res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
});