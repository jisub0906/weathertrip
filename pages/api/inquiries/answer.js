import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';
import { ObjectId } from 'mongodb';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * 문의 답변 등록 API 라우트 핸들러
 * - POST: 관리자만 특정 문의에 답변을 등록할 수 있음
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(등록 결과 메시지, 답변 ID 등)
 */
export default withErrorHandler(async (req, res) => {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  // 관리자 인증(JWT 토큰)
  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '답변 권한이 없습니다.' });
  }

  // 요청 본문에서 문의ID, 답변 내용 추출
  const { inquiryId, answer } = req.body;

  // 문의 ID 유효성 검사
  if (!inquiryId || !ObjectId.isValid(inquiryId)) {
    return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
  }

  // 답변 내용 유효성 검사
  if (!answer?.trim()) {
    return res.status(400).json({ message: '답변 내용이 비어 있습니다.' });
  }

  // inquiries 컬렉션 참조
  const inquiries = await getCollection('inquiries');

  // 답변 객체 생성: 답변의 고유 ID, 내용, 작성자, 생성시각, 삭제여부 포함
  const answerBlock = {
    _id: new ObjectId(), // 답변 고유 식별자
    text: answer, // 답변 본문
    createdBy: 'admin', // 관리자 작성
    createdAt: new Date(), // 답변 작성 시각
    isDeleted: false // soft delete 여부
  };

  // 문의 문서에 답변 추가 및 상태/시각 갱신
  const result = await inquiries.updateOne(
    { _id: toObjectId(inquiryId) },
    {
      $push: { answers: answerBlock }, // answers 배열에 답변 추가
      $set: {
        status: 'answered', // 문의 상태를 '답변완료'로 변경
        updatedAt: new Date(), // 문의 수정 시각 갱신
        answeredAt: new Date() // 답변 등록 시각 기록
      }
    }
  );

  // 문의 문서가 없거나 답변 추가 실패 시 에러 반환
  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: '해당 문의를 찾을 수 없습니다.' });
  }

  return res.status(200).json({
    message: '답변이 등록되었습니다.',
    status: 'answered',
    answerId: answerBlock._id // 프론트엔드에서 답변 추적 가능
  });
});