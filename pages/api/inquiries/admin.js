import { getCollection, toObjectId } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { withErrorHandler } from '../../../lib/middlewares/errorHandler';

const secret = process.env.NEXTAUTH_SECRET;

export default withErrorHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  const token = await getToken({ req, secret });
  if (!token || token.role !== 'admin') {
    return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
  }

  const { type, locationId, status } = req.query;
  const filter = {};

  if (type === 'general' || type === 'tourist') {
    filter.targetType = type;
  }

  if (locationId) {
    filter.attractionId = toObjectId(locationId);
  }

  if (status === 'pending' || status === 'answered') {
    filter.status = status;
  }

  const inquiries = await getCollection('inquiries');
  const results = await inquiries.find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return res.status(200).json({ inquiries: results });
});