import { connectToDatabase } from '../../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * 관광지 좋아요/좋아요 취소 API 라우트 핸들러
 * - POST: 사용자의 관광지 좋아요 추가/제거 및 현재 좋아요 수 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(관광지별 좋아요 수)
 */
export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  // 관광지 ID 유효성 검사
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: '유효하지 않은 관광지 ID입니다.' });
  }

  // DB 연결 및 컬렉션 참조
  const { db } = await connectToDatabase();
  const attractionId = new ObjectId(id);

  if (method === 'POST') {
    // 요청 바디에서 사용자 ID, 좋아요 여부 추출
    const { userId, liked } = req.body;

    // 사용자 ID 유효성 검사
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: '사용자 정보가 필요합니다.' });
    }

    const userObjectId = new ObjectId(userId);
    const likeCollection = db.collection('likes');
    const attractionsCollection = db.collection('attractions');
    
    // 해당 사용자의 기존 좋아요 여부 확인
    const existing = await likeCollection.findOne({
      attractionId,
      userId: userObjectId
    });

    if (liked) {
      /**
       * 좋아요 추가 로직
       * - 기존에 좋아요가 없으면 likes 컬렉션에 추가, attractions의 likeCount 증가
       */
      if (!existing) {
        await likeCollection.insertOne({
          attractionId,
          userId: userObjectId,
          createdAt: new Date()
        });
        // attractions 컬렉션의 likeCount 증가
        await attractionsCollection.updateOne(
          { _id: attractionId },
          { $inc: { likeCount: 1 } }
        );
      }
    } else {
      /**
       * 좋아요 제거 로직
       * - 기존에 좋아요가 있으면 likes 컬렉션에서 삭제, attractions의 likeCount 감소
       */
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

    // 현재 관광지의 좋아요 수 반환
    const count = await likeCollection.countDocuments({ attractionId });
    return res.status(200).json({ count });
  }

  // 허용되지 않은 메서드 처리
  return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
}
