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

    // 전체 좋아요 수 세기
    const count = await db.collection('likes').countDocuments({ attractionId });

    // 로그인한 사용자의 경우 좋아요 상태도 함께 반환
    if (userId && ObjectId.isValid(userId)) {
      try {
        const userObjectId = new ObjectId(userId);
        const liked = await db.collection('likes').findOne({ attractionId, userId: userObjectId });
    
        return res.status(200).json({
          liked: !!liked,
          count
        });
      } catch (err) {
        console.error('좋아요 상태 조회 중 오류:', err);
        return res.status(500).json({ message: '좋아요 상태 확인 실패' });
      }
    }

    // 로그인하지 않은 사용자의 경우 좋아요 수만 반환
    return res.status(200).json({
      count
    });
  } catch (error) {
    console.error('likeStatus 오류:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
}
