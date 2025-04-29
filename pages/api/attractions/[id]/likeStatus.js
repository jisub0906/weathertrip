// /pages/api/attractions/[id]/likeStatus.js
import { connectToDatabase } from '../../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * 관광지 좋아요 상태 및 전체 좋아요 수 조회 API 라우트 핸들러
 * - GET: 관광지별 전체 좋아요 수, (로그인 시) 사용자의 좋아요 여부 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(좋아요 수, liked 여부)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const { id } = req.query;
  const { userId } = req.query;

  try {
    // DB 연결 및 컬렉션 참조
    const { db } = await connectToDatabase();

    const attractionId = new ObjectId(id);

    // 전체 좋아요 수 세기
    const count = await db.collection('likes').countDocuments({ attractionId });

    // 로그인한 사용자의 경우 좋아요 상태도 함께 반환
    if (userId && ObjectId.isValid(userId)) {
      try {
        const userObjectId = new ObjectId(userId);
        // 해당 사용자의 좋아요 여부 조회
        const liked = await db.collection('likes').findOne({ attractionId, userId: userObjectId });
    
        return res.status(200).json({
          liked: !!liked,
          count
        });
      } catch (err) {
        // DB/서버 오류 처리
        return res.status(500).json({ message: '좋아요 상태 확인 실패' });
      }
    }

    // 로그인하지 않은 사용자의 경우 좋아요 수만 반환
    return res.status(200).json({
      count
    });
  } catch (error) {
    // DB/서버 오류 처리
    return res.status(500).json({ message: '서버 오류' });
  }
}
