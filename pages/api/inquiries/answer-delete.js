import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';
import { ObjectId } from 'mongodb'; // 

const secret = process.env.NEXTAUTH_SECRET;

/**
 * 문의 답변 단일 삭제(soft delete) API 라우트 핸들러
 * - PATCH: 관리자만 특정 문의의 답변을 삭제(표시)할 수 있음
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(삭제 결과 메시지)
 */
export default withErrorHandler(async (req, res) => {
  // PATCH 메서드만 허용
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  // 관리자 인증(JWT 토큰)
  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '삭제 권한이 없습니다.' });
  }

  // 요청 본문에서 문의ID, 답변ID 추출
  const { inquiryId, answerId } = req.body;

  // inquiries 컬렉션 참조
  const inquiries = await getCollection('inquiries');
  // 답변 soft delete 처리: answers 배열 내 해당 답변의 isDeleted를 true로 변경
  const result = await inquiries.updateOne(
    {
      _id: toObjectId(inquiryId),
      'answers._id': new ObjectId(answerId) // answers 배열 내 특정 답변 식별
    },
    {
      $set: {
        'answers.$.isDeleted': true, // 답변을 실제 삭제하지 않고 isDeleted 플래그만 변경
        updatedAt: new Date() // 문의 수정 시각 갱신
      }
    }
  );

  // 수정된 문서가 없으면(=답변ID 불일치) 에러 반환
  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
  }

  return res.status(200).json({ message: '답변이 삭제되었습니다.' });
});