import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';
import { ObjectId } from 'mongodb'; // ✅ 꼭 추가해줘야 함!

const secret = process.env.NEXTAUTH_SECRET;

export default withErrorHandler(async (req, res) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '삭제 권한이 없습니다.' });
  }

  const { inquiryId, answerId } = req.body;

  const inquiries = await getCollection('inquiries');
  const result = await inquiries.updateOne(
    {
      _id: toObjectId(inquiryId),
      'answers._id': new ObjectId(answerId) // ✅ 문자열 → ObjectId 변환
    },
    {
      $set: {
        'answers.$.isDeleted': true,
        updatedAt: new Date()
      }
    }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
  }

  return res.status(200).json({ message: '답변이 삭제되었습니다.' });
});