import { getDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { Review } from '../../../../models/Review';

export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { comment } = req.body;

  if (!comment || comment.trim() === '') {
    return res.status(400).json({ message: '댓글은 필수입니다.' });
  }

  try {
    const review = new Review({
      attractionId: req.query.id,
      userId: req.body.userId,
      comment: comment.trim(),
      date: new Date()
    });

    await review.save();

    // 리뷰 목록 가져오기
    const allReviews = await Review.find({ attractionId: req.query.id });

    res.status(201).json({
      _id: review._id,
      comment: review.comment,
      userName: req.body.userName,
      date: review.date
    });
  } catch (error) {
    console.error('리뷰 저장 실패:', error);
    res.status(500).json({ message: '리뷰 저장 중 오류가 발생했습니다.' });
  }
} 