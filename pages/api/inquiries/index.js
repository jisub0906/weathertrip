import { getCollection, ObjectId, toObjectId } from '../../../lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { withErrorHandler, validationError, authError } from '../../../lib/middlewares/errorHandler';

export default withErrorHandler(async (req, res) => {
  const inquiries = await getCollection('inquiries');

  if (req.method === 'GET') {
    // 전체 문의 목록 조회
    const results = await inquiries.find({})
      .sort({ createdAt: -1 }) // 최신순 정렬
      .toArray();

    return res.status(200).json({ inquiries: results });
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return authError(res, '로그인한 사용자만 문의를 등록할 수 있습니다.');
    }

    const {
      targetType = 'tourist',
      attractionId,
      attractionName,
      title,
      content,
      isSecret
    } = req.body;

    if (!title || !content) {
      return validationError(res, '필수 항목이 누락되었습니다.', {
        title: !title ? '필수' : undefined,
        content: !content ? '필수' : undefined
      });
    }

    if (targetType === 'tourist' && (!attractionId || !attractionName)) {
      return validationError(res, '관광지 문의의 경우 관광지 정보를 입력해야 합니다.', {
        attractionId: !attractionId ? '필수' : undefined,
        attractionName: !attractionName ? '필수' : undefined
      });
    }

    const newInquiry = {
      targetType,
      attractionId: targetType === 'tourist' ? toObjectId(attractionId) : null,
      attractionName: targetType === 'tourist' ? attractionName : null,
      title,
      content,
      isSecret: !!isSecret,
      status: 'pending',
      email: session.user.email,
      // userId: toObjectId(session.user.id),  // ← 필요 없으면 그대로 주석
      nickname: session.user.nickname || session.user.name || '익명',
      createdAt: new Date(),
      updatedAt: new Date(),
      answeredAt: null,
    
      // ✅ 관리자 답변은 처음에 입력하지 않음
      answers: [],
    
      feedback: {
        isHelpful: null,
        votedAt: null
      }
    };
    

    const result = await inquiries.insertOne(newInquiry);

    return res.status(201).json({
      message: '문의가 등록되었습니다.',
      inquiryId: result.insertedId
    });
  }

  res.status(405).json({ message: '허용되지 않는 요청입니다.' });
});