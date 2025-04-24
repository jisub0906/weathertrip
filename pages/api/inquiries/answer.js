import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';
import { ObjectId } from 'mongodb';

const secret = process.env.NEXTAUTH_SECRET;

export default withErrorHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '답변 권한이 없습니다.' });
  }

  const { inquiryId, answer } = req.body;

  if (!inquiryId || !ObjectId.isValid(inquiryId)) {
    return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
  }

  if (!answer?.trim()) {
    return res.status(400).json({ message: '답변 내용이 비어 있습니다.' });
  }

  const inquiries = await getCollection('inquiries');

  const answerBlock = {
    _id: new ObjectId(),
    text: answer,
    createdBy: 'admin',
    createdAt: new Date(),
    isDeleted: false
  };

  const result = await inquiries.updateOne(
    { _id: toObjectId(inquiryId) },
    {
      $push: { answers: answerBlock },
      $set: {
        status: 'answered',
        updatedAt: new Date(),
        answeredAt: new Date()
      }
    }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: '해당 문의를 찾을 수 없습니다.' });
  }

  return res.status(200).json({
    message: '답변이 등록되었습니다.',
    status: 'answered',
    answerId: answerBlock._id  // ✅ 프론트에서 추적 가능
  });
});