import { getDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { id } = req.query;
    const { liked } = req.body;
    
    // liked 파라미터 확인
    if (liked === undefined) {
      return res.status(400).json({ message: 'liked 파라미터가 필요합니다.' });
    }
    
    // ObjectId 유효성 검사
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: '유효하지 않은 관광지 ID입니다.' });
    }

    const db = await getDatabase();
    const attractions = db.collection('attractions');
    const likes = db.collection('likes');
    
    // 관광지 존재 확인
    const attraction = await attractions.findOne({ _id: new ObjectId(id) });
    if (!attraction) {
      return res.status(404).json({ message: '관광지를 찾을 수 없습니다.' });
    }
    
    // 임시 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
    const userId = 'anonymous-user';
    
    if (liked) {
      // 좋아요 추가
      await likes.updateOne(
        { userId, attractionId: new ObjectId(id) },
        { $set: { userId, attractionId: new ObjectId(id), createdAt: new Date() } },
        { upsert: true }
      );
    } else {
      // 좋아요 취소
      await likes.deleteOne({ userId, attractionId: new ObjectId(id) });
    }
    
    // 좋아요 수 업데이트
    const likeCount = await likes.countDocuments({ attractionId: new ObjectId(id) });
    
    await attractions.updateOne(
      { _id: new ObjectId(id) },
      { $set: { likeCount } }
    );
    
    return res.status(200).json({
      success: true,
      liked,
      likeCount,
      message: liked ? '좋아요가 추가되었습니다.' : '좋아요가 취소되었습니다.'
    });
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.stack });
  }
} 