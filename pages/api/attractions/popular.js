import { getDatabase } from '../../../lib/db/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  try {
    const db = await getDatabase();
    const attractions = db.collection('attractions');
    const likes = db.collection('likes');
    
    const limit = parseInt(req.query.limit) || 10;
    
    // 좋아요 수가 있는 관광지 조회
    const popularAttractions = await attractions
      .aggregate([
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'attractionId',
            as: 'likes'
          }
        },
        {
          $addFields: {
            likeCount: { $size: '$likes' }
          }
        },
        {
          $match: {
            likeCount: { $gt: 0 }
          }
        },
        {
          $sort: { likeCount: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            likes: 0
          }
        }
      ])
      .toArray();

    console.log('인기 관광지 조회 결과:', popularAttractions);

    if (!popularAttractions || popularAttractions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          attractions: [],
          total: 0
        },
        message: '인기 관광지가 아직 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attractions: popularAttractions,
        total: popularAttractions.length
      }
    });
  } catch (error) {
    console.error('인기 관광지 조회 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
} 