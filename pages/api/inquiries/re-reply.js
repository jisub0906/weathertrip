import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';

const secret = process.env.NEXTAUTH_SECRET;

export default withErrorHandler(async (req, res) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }

  const { inquiryId, answerId, text } = req.body;
  if (!inquiryId || !answerId || !text?.trim()) {
    return res.status(400).json({ message: '필수 값이 누락되었습니다.' });
  }

  const inquiries = await getCollection('inquiries');

  const result = await inquiries.updateOne(
    {
      _id: toObjectId(inquiryId),
      'answers._id': toObjectId(answerId)
    },
    {
      $set: {
        'answers.$.followUp.reReply': {
          text,
          createdAt: new Date()
        },
        updatedAt: new Date()
      }
    }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
  }

  return res.status(200).json({ message: '재답변이 등록되었습니다.' });
});
