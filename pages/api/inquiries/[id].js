import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { withErrorHandler, authError } from '../../../lib/middlewares/errorHandler';

export default withErrorHandler(async (req, res) => {
    const inquiries = await getCollection('inquiries');
    const id = req.query.id;

    if (req.method === 'DELETE') {
        const session = await getServerSession(req, res, authOptions);
        if (!session) return authError(res, '로그인이 필요합니다.');

        const inquiry = await inquiries.findOne({ _id: toObjectId(id) });
        if (!inquiry) return res.status(404).json({ message: '문의가 존재하지 않습니다.' });

        const isOwner = inquiry.email === session.user.email;
        if (!isOwner) return res.status(403).json({ message: '삭제 권한이 없습니다.' });

        await inquiries.deleteOne({ _id: toObjectId(id) });
        return res.status(200).json({ message: '삭제되었습니다.' });
    }

    res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
});
