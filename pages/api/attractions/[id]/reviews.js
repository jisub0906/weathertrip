import { getDatabase } from '@lib/db/mongodb';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const db = await getDatabase();
      
      const reviews = await db.collection('reviews')
        .find({ attractionId: id })
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json({ success: true, reviews });
    } catch (error) {
      console.error('리뷰 조회 오류:', error);
      res.status(500).json({ success: false, error: '리뷰를 불러오는데 실패했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 