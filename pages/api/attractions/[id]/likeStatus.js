// /pages/api/attractions/[id]/likeStatus.js
import { connectToDatabase } from '../../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const { id } = req.query;
  const { userId } = req.query;

  try {
    const { db } = await connectToDatabase();

    const attractionId = new ObjectId(id);
    const userObjectId = new ObjectId(userId);

    // 유저가 좋아요 눌렀는지 확인
    const liked = await db.collection('likes').findOne({ attractionId, userId: userObjectId });

    // 전체 좋아요 수 세기
    const count = await db.collection('likes').countDocuments({ attractionId });

    return res.status(200).json({
      liked: !!liked,
      count
    });
  } catch (error) {
    console.error('likeStatus 오류:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
}
