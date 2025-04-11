import { getDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { id } = req.query;
    
    // ObjectId 유효성 검사
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: '유효하지 않은 관광지 ID입니다.' });
    }

    const db = await getDatabase();
    const reviews = db.collection('reviews');
    
    // 관광지의 모든 리뷰 가져오기
    const attractionReviews = await reviews
      .find({ attractionId: new ObjectId(id) })
      .sort({ date: -1 }) // 최신 순으로 정렬
      .toArray();
    
    // 응답 데이터 포맷팅
    const formattedReviews = attractionReviews.map(review => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      userName: review.userName,
      date: review.date
    }));
    
    return res.status(200).json({
      success: true,
      count: formattedReviews.length,
      reviews: formattedReviews
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.stack });
  }
} 