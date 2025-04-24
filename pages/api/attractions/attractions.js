import { getDatabase } from '../../../lib/db/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: '허용되지 않는 메서드입니다.' 
    });
  }

  try {
    const db = await getDatabase();
    const attractions = db.collection('attractions');

    // 컬렉션 존재 여부 확인
    const collections = await db.listCollections({ name: 'attractions' }).toArray();
    if (collections.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'attractions 컬렉션이 존재하지 않습니다.'
      });
    }

    // 2dsphere 인덱스 확인 및 생성
    const indexes = await attractions.indexes();
    const hasGeoIndex = indexes.some(index => 
      index.key && index.key.location === '2dsphere'
    );

    if (!hasGeoIndex) {
      try {
        await attractions.createIndex({ location: '2dsphere' });
        console.log('2dsphere 인덱스 생성 완료');
      } catch (indexError) {
        console.error('2dsphere 인덱스 생성 실패:', indexError);
      }
    }

    // 전체 관광지 수 확인
    const totalCount = await attractions.countDocuments();
    console.log(`전체 관광지 수: ${totalCount}`);

    // 샘플 데이터 구조 확인
    const sampleAttraction = await attractions.findOne();
    console.log('샘플 관광지 데이터:', sampleAttraction);

    const { latitude, longitude, radius = 5, limit = 20, weatherCondition } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        message: '위도와 경도가 필요합니다.' 
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // 좌표 유효성 검사
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 좌표입니다.'
      });
    }

    const searchRadius = parseFloat(radius);
    const searchLimit = parseInt(limit);

    // 날씨 조건에 따른 관광지 타입 필터링
    let typeQuery = {};
    if (weatherCondition) {
      switch (weatherCondition) {
        case 'Rain':
        case 'Snow':
          typeQuery = { type: 'indoor' };
          break;
        case 'Clear':
          typeQuery = { type: 'outdoor' };
          break;
        default:
          typeQuery = { type: { $in: ['indoor', 'outdoor', 'both'] } };
      }
    }

    // MongoDB 쿼리 파이프라인
    const pipeline = [
      {
        $geoNear: {
          near: { 
            type: "Point", 
            coordinates: [lng, lat]
          },
          distanceField: "calcDistance",
          maxDistance: searchRadius * 1000, // km를 m로 변환
          spherical: true,
          query: typeQuery
        }
      },
      {
        $addFields: {
          distance: { $divide: ["$calcDistance", 1000] } // 미터를 킬로미터로 변환
        }
      },
      {
        $match: {
          distance: { $lte: searchRadius } // 설정된 반경 내의 결과만 필터링
        }
      },
      {
        $sort: { distance: 1 }
      },
      {
        $limit: searchLimit
      },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          type: 1,
          description: 1,
          images: 1,
          location: 1,
          distance: { $round: ["$distance", 1] }, // 거리를 소수점 첫째 자리까지 반올림
          distanceKm: { $round: ["$distance", 1] }, // 동일한 값을 distanceKm 필드에도 저장
          tags: 1,
          테마명: 1,
          실내구분: 1
        }
      }
    ];

    console.log('검색 파라미터:', {
      coordinates: [lng, lat],
      radius: searchRadius,
      limit: searchLimit,
      typeQuery
    });

    let results = [];
    try {
      results = await attractions.aggregate(pipeline).toArray();
      console.log(`검색 결과: ${results.length}개 관광지 찾음`);
      if (results.length > 0) {
        console.log('첫 번째 결과:', {
          name: results[0].name,
          distance: results[0].distance,
          coordinates: results[0].location?.coordinates,
          tags: results[0].tags,
          테마명: results[0].테마명,
          실내구분: results[0].실내구분
        });
      }
    } catch (error) {
      console.error('관광지 검색 오류:', error);
      return res.status(500).json({
        success: false,
        message: '관광지 검색 중 오류가 발생했습니다.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      searchParams: {
        latitude: lat,
        longitude: lng,
        radius: searchRadius,
        totalAttractions: totalCount
      },
      attractions: results
    });

  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}