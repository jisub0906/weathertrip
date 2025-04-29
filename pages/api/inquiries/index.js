import { getCollection, ObjectId, toObjectId } from '../../../lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { withErrorHandler, validationError, authError } from '../../../lib/middlewares/errorHandler';

/**
 * 문의 목록 조회 및 문의 등록 API 라우트 핸들러
 * - GET: 로그인한 사용자는 본인 문의만, 관리자는 전체 문의 목록 조회
 * - POST: 로그인한 사용자가 문의 등록
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(문의 목록 또는 등록 결과)
 */
export default withErrorHandler(async (req, res) => {
  // inquiries 컬렉션 참조
  const inquiries = await getCollection('inquiries');

  if (req.method === 'GET') {
    // 세션 정보로 사용자 권한 확인
    const session = await getServerSession(req, res, authOptions);
    const filters = {};

    // 일반 사용자는 본인 이메일로만 필터링, 관리자는 전체 조회
    if (session?.user?.role !== 'admin') {
      if (!session?.user?.email) {
        return res.status(403).json({ message: '로그인이 필요합니다.' });
      }
      filters.email = session.user.email; // 본인 문의만 조회
    }

    // 문의 목록을 최신순으로 조회
    const results = await inquiries.find(filters)
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ inquiries: results });
  }

  if (req.method === 'POST') {
    // 로그인한 사용자만 문의 등록 가능
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return authError(res, '로그인한 사용자만 문의를 등록할 수 있습니다.');
    }

    // 요청 본문에서 문의 정보 추출
    const {
      targetType = 'tourist',
      attractionId,
      attractionName,
      title,
      content
    } = req.body;

    // 필수 항목(제목, 내용) 누락 시 에러 반환
    if (!title || !content) {
      return validationError(res, '필수 항목이 누락되었습니다.', {
        title: !title ? '필수' : undefined,
        content: !content ? '필수' : undefined
      });
    }

    // 관광지 문의의 경우 관광지 정보 필수
    if (targetType === 'tourist' && (!attractionId || !attractionName)) {
      return validationError(res, '관광지 문의의 경우 관광지 정보를 입력해야 합니다.', {
        attractionId: !attractionId ? '필수' : undefined,
        attractionName: !attractionName ? '필수' : undefined
      });
    }

    // 신규 문의 객체 생성
    const newInquiry = {
      targetType, // 문의 유형(일반/관광지)
      attractionId: targetType === 'tourist' ? toObjectId(attractionId) : null, // 관광지 문의일 경우 ObjectId 변환
      attractionName: targetType === 'tourist' ? attractionName : null, // 관광지명
      title, // 문의 제목
      content, // 문의 내용
      status: 'pending', // 초기 상태: 답변 대기
      email: session.user.email, // 작성자 이메일
      nickname: session.user.nickname , // 작성자 닉네임
      createdAt: new Date(), // 생성 시각
      updatedAt: new Date(), // 수정 시각
      answeredAt: null, // 답변 등록 시각(초기 null)
      answers: [], // 답변 배열
      feedback: {
        isHelpful: null, // 유용성 평가(초기 null)
        votedAt: null // 평가 시각(초기 null)
      }
    };

    // 문의 등록
    const result = await inquiries.insertOne(newInquiry);

    return res.status(201).json({
      message: '문의가 등록되었습니다.',
      inquiryId: result.insertedId
    });
  }

  // 허용되지 않는 메서드 처리
  res.status(405).json({ message: '허용되지 않는 요청입니다.' });
});