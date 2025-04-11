import { getDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { id } = req.query;
    const { rating, comment } = req.body;
    
    // 필수 필드 검증
    if (!rating || !comment || comment.trim() === '') {
      return res.status(400).json({ message: '평점과 댓글은 필수입니다.' });
    }
    
    // ObjectId 유효성 검사
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: '유효하지 않은 관광지 ID입니다.' });
    }

    const db = await getDatabase();
    const attractions = db.collection('attractions');
    const reviews = db.collection('reviews');
    
    // 관광지 존재 확인
    const attraction = await attractions.findOne({ _id: new ObjectId(id) });
    if (!attraction) {
      return res.status(404).json({ message: '관광지를 찾을 수 없습니다.' });
    }
    
    // 리뷰 생성
    const reviewDoc = {
      attractionId: new ObjectId(id),
      rating: parseInt(rating),
      comment,
      userName: '방문자', // 나중에 사용자 인증 추가 시 실제 사용자 정보 사용
      date: new Date()
    };
    
    const result = await reviews.insertOne(reviewDoc);
    
    // 관광지 평균 평점 업데이트
    const allReviews = await reviews.find({ attractionId: new ObjectId(id) }).toArray();
    const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
    
    await attractions.updateOne(
      { _id: new ObjectId(id) },
      { $set: { averageRating: avgRating, reviewCount: allReviews.length } }
    );
    
    return res.status(201).json({
      ...reviewDoc,
      _id: result.insertedId,
      success: true,
      message: '리뷰가 성공적으로 저장되었습니다.'
    });
  } catch (error) {
    console.error('리뷰 저장 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.stack });
  }
} 