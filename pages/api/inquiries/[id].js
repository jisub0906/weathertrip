import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler, authError } from '../../../lib/middlewares/errorHandler';

const secret = process.env.NEXTAUTH_SECRET;

export default withErrorHandler(async (req, res) => {
  const inquiries = await getCollection('inquiries');
  const id = req.query.id;

  // ✅ DELETE - 작성자 또는 관리자만 삭제 가능
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