import { getCollection, ObjectId, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler, authError } from '../../../lib/middlewares/errorHandler';

const secret = process.env.NEXTAUTH_SECRET;

export default withErrorHandler(async (req, res) => {
  const inquiries = await getCollection('inquiries');
  const id = req.query.id;

  // ✅ PATCH - 관리자 답변 추가
  if (req.method === 'PATCH') {
    const token = await getToken({ req, secret });
    if (!token || token.role !== 'admin') {
      return res.status(403).json({ message: '답변 권한이 없습니다.' });
    }

    const { answer } = req.body;
    if (!answer?.trim()) {
      return res.status(400).json({ message: '답변 내용이 비어 있습니다.' });
    }

    const answerBlock = {
      _id: new ObjectId(), // ✅ 올바른 ObjectId 생성
      text: answer,
      createdBy: 'admin',
      createdAt: new Date(),
      isDeleted: false
    };

    await inquiries.updateOne(
      { _id: toObjectId(id) },
      {
        $push: { answers: answerBlock },
        $set: {
          status: 'answered',
          updatedAt: new Date(),
          answeredAt: new Date()
        }
      }
    );

    return res.status(200).json({ message: '답변이 등록되었습니다.', status: 'answered' });
  }

  // ✅ DELETE - 작성자 또는 관리자만 삭제 가능 (기존 유지)
  if (req.method === 'DELETE') {
    const token = await getToken({ req, secret });
    if (!token) return authError(res, '로그인이 필요합니다.');

    const inquiry = await inquiries.findOne({ _id: toObjectId(id) });
    if (!inquiry) return res.status(404).json({ message: '문의가 존재하지 않습니다.' });

    const isOwner = inquiry.email === token.email;
    const isAdmin = token.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await inquiries.deleteOne({ _id: toObjectId(id) });
    return res.status(200).json({ message: '삭제되었습니다.' });
  }

  res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
});