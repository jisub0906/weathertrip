import { connectToDatabase } from '../../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: '유효하지 않은 관광지 ID입니다.' });
  }

  const { db } = await connectToDatabase();
  const attractionId = new ObjectId(id);

  if (method === 'POST') {
    const { userId, liked } = req.body;

    if (!userId) {
      return res.status(400).json({ message: '사용자 정보가 필요합니다.' });
    }

    const likeCollection = db.collection('likes');
    const attractionsCollection = db.collection('attractions');
    const existing = await likeCollection.findOne({
      attractionId,
      userId
    });

    if (liked) {
      // 좋아요 추가
      if (!existing) {
        await likeCollection.insertOne({
          attractionId,
          userId,
          createdAt: new Date()
        });
        // attractions 컬렉션의 likeCount 증가
        await attractionsCollection.updateOne(
          { _id: attractionId },
          { $inc: { likeCount: 1 } }
        );
      }
    } else {
      // 좋아요 제거
      if (existing) {
        await likeCollection.deleteOne({
          _id: existing._id
        });
        // attractions 컬렉션의 likeCount 감소
        await attractionsCollection.updateOne(
          { _id: attractionId },
          { $inc: { likeCount: -1 } }
        );
      }
    }

    // 좋아요 수 반환
    const count = await likeCollection.countDocuments({ attractionId });
    return res.status(200).json({ count });
  }

  return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
}
