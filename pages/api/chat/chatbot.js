// pages/api/chat/chatbot.js
import { getDatabase } from '../../../lib/db/mongodb';
const axios = require('axios');

// 날씨 데이터를 가져오는 함수
async function fetchWeather(longitude, latitude) {
  try {
    // 내부 weather API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/weather?longitude=${longitude}&latitude=${latitude}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`날씨 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '날씨 데이터를 가져오는 중 오류가 발생했습니다.');
    }

    // 날씨 상태에 따른 한글 설명
    const weatherDescriptions = {
      'Clear': '맑음',
      'Clouds': '흐림',
      'Rain': '비',
      'Snow': '눈',
      'Drizzle': '이슬비',
      'Thunderstorm': '천둥번개',
      'Mist': '안개',
      'Fog': '안개',
      'Haze': '연무'
    };

    // 날씨 데이터 포맷팅
    const weatherData = {
      temperature: Math.round(data.data.temperature),
      feelsLike: Math.round(data.data.feelsLike),
      humidity: data.data.humidity,
      windSpeed: data.data.windSpeed,
      condition: data.data.condition,
      description: weatherDescriptions[data.data.condition] || data.data.condition,
      icon: data.data.icon
    };

    return weatherData;
  } catch (error) {
    console.error('날씨 데이터 가져오기 실패:', error);
    return getDefaultWeather();
  }
}

// 기본 날씨 데이터
function getDefaultWeather() {
  return {
    temperature: 23,
    feelsLike: 25,
    humidity: 65,
    windSpeed: 2.5,
    condition: "Clear",
    description: "맑음",
    icon: "01d",
    isBackupData: true
  };
}

// 주변 관광지 찾기 함수
async function findNearbyAttractions(longitude, latitude, weatherCondition, radius = 5) {
  try {
    const db = await getDatabase();
    const attractions = db.collection('attractions');

    // 좌표 변환
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat)) {
      console.error('유효하지 않은 좌표:', { longitude, latitude });
      return {
        success: false,
        message: '위치 정보가 올바르지 않습니다.',
        attractions: []
      };
    }

    // 날씨 조건에 따른 필터
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

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat]
          },
          distanceField: "calcDistance",
          maxDistance: radius * 1000,
          spherical: true,
          query: typeQuery
        }
      },
      {
        $addFields: {
          distanceKm: {
            $round: [{ $divide: ["$calcDistance", 1000] }, 1]
          }
        }
      },
      {
        $match: {
          distanceKm: { $lte: radius }
        }
      },
      {
        $sort: { distanceKm: 1 }
      },
      {
        $limit: 5
      }
    ];

    console.log('주변 관광지 검색 파라미터:', { longitude: lng, latitude: lat, radius, weatherCondition });

    const results = await attractions.aggregate(pipeline).toArray();
    console.log(`검색된 관광지 수: ${results.length}`);

    if (results.length > 0) {
      console.log('첫 번째 검색 결과:', {
        name: results[0].name,
        distance: results[0].distanceKm,
        type: results[0].type
      });
    }

    return {
      success: true,
      message: `${results.length}개의 관광지를 찾았습니다.`,
      attractions: results.map(attraction => ({
        _id: attraction._id,
        name: attraction.name,
        address: attraction.address,
        type: attraction.type,
        description: attraction.description,
        tags: attraction.tags || [],
        distance: attraction.distanceKm,
        openingHours: attraction.openingHours || null,
        admissionFee: attraction.admissionFee || null
      }))
    };

  } catch (error) {
    console.error('주변 관광지 검색 오류:', error);
    return {
      success: false,
      message: '관광지 검색 중 오류가 발생했습니다.',
      attractions: []
    };
  }
}

// 두 좌표 간의 거리 계산 함수 (하버사인 공식)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반경 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c;
  return d;
}

function toRad(value) {
  return value * Math.PI / 180;
}

// 특정 관광지 찾기 함수
async function findAttraction(attractionId) {
  try {
    const db = await getDatabase();
    const attractions = db.collection('attractions');
    
    const attraction = await attractions.findOne({ _id: attractionId });
    return attraction;
  } catch (error) {
    console.error('관광지 검색 오류:', error);
    return null;
  }
}

// 관광지명 인식 함수
async function identifyAttraction(message) {
  const lowerMessage = message.toLowerCase();
  
  try {
    const db = await getDatabase();
    const attractions = db.collection('attractions');
    
    // 모든 관광지 이름을 가져와서 메시지와 비교
    const allAttractions = await attractions.find({}, { projection: { name: 1 } }).toArray();
    
    for (const attraction of allAttractions) {
      if (!attraction.name) continue;
      
      // 관광지명이 메시지에 포함되어 있는지 확인
      if (lowerMessage.includes(attraction.name.toLowerCase())) {
        return await attractions.findOne({ _id: attraction._id });
      }
      
      // 공백 제거하고 확인 (예: '경복궁' vs '경 복궁')
      const noSpaceAttrName = attraction.name.replace(/\s+/g, '').toLowerCase();
      const noSpaceMessage = lowerMessage.replace(/\s+/g, '');
      if (noSpaceMessage.includes(noSpaceAttrName)) {
        return await attractions.findOne({ _id: attraction._id });
      }
    }
  } catch (error) {
    console.error('관광지 식별 오류:', error);
  }
  
  return null;
}

// 메시지 의도 분석 함수
function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('주변') || lowerMessage.includes('근처')) {
    return 'nearby';
  }
  
  if (lowerMessage.includes('날씨')) {
    return 'weather';
  }
  
  if (lowerMessage.includes('알려줘') || lowerMessage.includes('설명')) {
    return 'info';
  }
  
  return 'unknown';
}

// 응답 생성 함수
async function generateResponse(intent, message, attraction, weatherData, nearbyAttractions) {
  try {
    console.log('응답 생성 시작:', { intent, message });
    console.log('주변 관광지 데이터:', nearbyAttractions);

    switch (intent) {
      case 'nearby':
        if (!nearbyAttractions || !nearbyAttractions.attractions || nearbyAttractions.attractions.length === 0) {
          return {
            response: "죄송합니다. 주변에서 관광지를 찾지 못했습니다.",
            context: {}
          };
        }
        
        const attractions = nearbyAttractions.attractions;
        
        // 텍스트 응답 형식 개선 - 간결하게
        return {
          response: `주변에 ${attractions.length}개의 관광지가 있습니다:`,
          context: { attractions }
        };

      case 'weather':
        if (!weatherData) {
          return {
            response: "죄송합니다. 날씨 정보를 가져올 수 없습니다.",
            context: {}
          };
        }
        
        let response = `현재 기온은 ${weatherData.temperature}°C이고, ${weatherData.description}입니다.`;
        if (weatherData.feelsLike) {
          response += ` 체감온도는 ${weatherData.feelsLike}°C입니다.`;
        }
        return {
          response,
          context: { weatherData }
        };

      case 'info':
        if (!attraction) {
          return {
            response: "죄송합니다. 관광지 정보를 찾을 수 없습니다.",
            context: {}
          };
        }
        
        // 더 자세한 응답 메시지 생성
        let infoResponse = "";
        
        // 관광지 이름과 설명 추가
        if (attraction.address) {
          infoResponse = `${attraction.name}\n\n${attraction.address}`;
        } else {
          infoResponse = `${attraction.name}\n\n해당 관광지에 대한 주소가 준비되지 않았습니다.`;
        }
        
        // 영업시간이나 입장료 등 기본 정보가 있다면 추가 (해당 필드가 있다는 가정)
        if (attraction.openingHours) {
          infoResponse += `\n\n🕒 영업시간: ${attraction.openingHours}`;
        }
        
        if (attraction.admissionFee) {
          infoResponse += `\n\n💰 입장료: ${attraction.admissionFee}`;
        }
        
        return {
          response: infoResponse,
          context: { attraction }
        };

      default:
        return {
          response: "죄송합니다. 질문을 이해하지 못했어요. 다시 말씀해 주시겠어요?",
          context: {}
        };
    }
  } catch (error) {
    console.error('응답 생성 중 오류:', error);
    return {
      response: "죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.",
      context: {}
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: '허용되지 않는 메서드입니다.' 
    });
  }

  try {
    const { message, attractionId, longitude, latitude } = req.body;
    console.log('요청 받은 데이터:', { message, attractionId, longitude, latitude });

    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: '메시지가 필요합니다.' 
      });
    }

    // 의도 분석
    const intent = analyzeIntent(message);
    console.log('분석된 의도:', intent);

    // 날씨 데이터 가져오기 (weather 의도일 때만)
    let weatherData = null;
    if (intent === 'weather' && longitude && latitude) {
      try {
        weatherData = await fetchWeather(longitude, latitude);
      } catch (error) {
        console.error('날씨 정보 조회 오류:', error);
      }
    }

    // 주변 관광지 데이터 가져오기 (nearby 의도일 때만)
    let nearbyAttractions = null;
    if (intent === 'nearby' && longitude && latitude) {
      try {
        nearbyAttractions = await findNearbyAttractions(
          longitude,
          latitude,
          weatherData?.condition || 'Clear'
        );
        console.log('검색된 주변 관광지:', nearbyAttractions);
      } catch (error) {
        console.error('주변 관광지 검색 오류:', error);
      }
    }

    // 특정 관광지 정보 가져오기 (info 의도일 때만)
    let selectedAttraction = null;
    if (intent === 'info' && attractionId) {
      try {
        const db = await getDatabase();
        const attractions = db.collection('attractions');
        selectedAttraction = await attractions.findOne({ _id: attractionId });
        console.log('선택된 관광지 정보:', selectedAttraction);
      } catch (error) {
        console.error('관광지 정보 조회 오류:', error);
      }
    } else if (intent === 'info') {
      // 메시지에서 관광지 이름 추출 시도
      try {
        const db = await getDatabase();
        const attractions = db.collection('attractions');
        const searchName = message.replace(/알려줘|정보|설명|대해/g, '').trim();
        console.log('검색할 관광지 이름:', searchName);
        
        if (searchName) {
          selectedAttraction = await attractions.findOne({
            name: { $regex: searchName, $options: 'i' }
          });
          console.log('이름으로 검색된 관광지:', selectedAttraction);
        }
      } catch (error) {
        console.error('관광지 이름 검색 오류:', error);
      }
    }

    // 응답 생성
    const { response, context } = await generateResponse(
      intent,
      message,
      selectedAttraction,
      weatherData,
      nearbyAttractions
    );

    return res.status(200).json({
      success: true,
      response,
      context,
      additionalData: {
        weather: weatherData,
        nearbyAttractions: nearbyAttractions?.attractions || []
      }
    });

  } catch (error) {
    console.error('챗봇 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
}