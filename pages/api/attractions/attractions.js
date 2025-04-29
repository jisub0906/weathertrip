import { getDatabase } from '../../../lib/db/mongodb';

/**
 * 반경 내 관광지 검색 API 라우트 핸들러
 * - GET: 위도/경도, 반경, 날씨 조건 등으로 주변 관광지 목록 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(관광지 배열, 검색 파라미터, 총 개수 등)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: '허용되지 않는 메서드입니다.' 
    });
  }

  try {
    // DB 연결 및 컬렉션 참조
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

    // 2dsphere 인덱스 확인 및 생성(위치 기반 검색을 위한 필수 인덱스)
    const indexes = await attractions.indexes();
    const hasGeoIndex = indexes.some(index => 
      index.key && index.key.location === '2dsphere'
    );

    if (!hasGeoIndex) {
      try {
        await attractions.createIndex({ location: '2dsphere' });
      } catch (indexError) {
        // 인덱스 생성 실패 시 무시(검색은 계속 시도)
      }
    }

    // 전체 관광지 수 확인(검색 파라미터에 활용)
    const totalCount = await attractions.countDocuments();

    // 쿼리 파라미터 추출 및 기본값 처리
    const { latitude, longitude, radius = 5, limit = 20, weatherCondition } = req.query;
    
    // 위도/경도 필수 체크
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

    /**
     * 날씨 조건에 따른 관광지 타입 필터링 쿼리 생성
     * - 비/눈: 실내, 맑음: 야외, 그 외: 전체
     */
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

    /**
     * MongoDB Aggregation Pipeline
     * - $geoNear: 위치 기반 반경 내 관광지 검색
     * - $addFields/$match/$sort/$limit/$project: 거리 계산, 필터링, 정렬, 필드 선택
     */
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

    let results = [];
    try {
      results = await attractions.aggregate(pipeline).toArray();
    } catch (error) {
      // DB/서버 오류 처리
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
    // DB/서버 오류 처리
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}