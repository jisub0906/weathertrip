// pages/api/chat/chatbot.js
import { getDatabase } from '../../../lib/db/mongodb';

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attractions?longitude=${longitude}&latitude=${latitude}&radius=${radius}&weatherCondition=${weatherCondition}`);
    
    if (!response.ok) {
      throw new Error(`관광지 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.attractions || data.attractions.length === 0) {
      return {
        success: false,
        message: '주변에 추천할 만한 관광지가 없습니다.',
        attractions: []
      };
    }

    // 거리순으로 정렬
    const sortedAttractions = data.attractions.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      message: `${sortedAttractions.length}개의 관광지를 찾았습니다.`,
      attractions: sortedAttractions.map(attraction => ({
        name: attraction.name,
        address: attraction.address,
        distance: attraction.distanceKm.toFixed(1),
        type: attraction.type,
        description: attraction.description,
        images: attraction.images || []
      }))
    };
  } catch (error) {
    console.error('관광지 검색 중 오류 발생:', error);
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
  
  // 의도별 키워드와 가중치
  const intentPatterns = {
    greeting: {
      patterns: [
        { regex: /^(안녕|하이|헬로|hi|hello)/, weight: 1.0 },
        { regex: /반가워/, weight: 0.8 },
        { regex: /처음.*뵙|처음.*만나/, weight: 0.8 }
      ]
    },
    weather: {
      patterns: [
        { regex: /날씨.*어때|어때.*날씨/, weight: 1.0 },
        { regex: /기온|온도|덥|추워/, weight: 0.8 },
        { regex: /비.*오|눈.*오/, weight: 0.9 }
      ]
    },
    location: {
      patterns: [
        { regex: /위치.*어디|어디.*위치/, weight: 1.0 },
        { regex: /가는.*방법|찾아가/, weight: 0.9 },
        { regex: /주소|네비/, weight: 0.8 }
      ]
    },
    nearby: {
      patterns: [
        { regex: /주변.*뭐|근처.*뭐/, weight: 1.0 },
        { regex: /가까운.*관광지|주변.*관광지/, weight: 0.9 },
        { regex: /다른.*볼거리|추천/, weight: 0.8 }
      ]
    },
    description: {
      patterns: [
        { regex: /[이것얘].*뭐야?/, weight: 0.7 },
        { regex: /설명|소개|특징/, weight: 0.9 },
        { regex: /알려줘|가르쳐/, weight: 0.6 }
      ]
    }
  };

  // 각 의도별 점수 계산
  const scores = {};
  for (const [intent, data] of Object.entries(intentPatterns)) {
    scores[intent] = 0;
    for (const pattern of data.patterns) {
      if (pattern.regex.test(lowerMessage)) {
        scores[intent] += pattern.weight;
      }
    }
  }

  // 가장 높은 점수의 의도 찾기
  let maxIntent = 'unknown';
  let maxScore = 0;
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent;
    }
  }

  // 최소 점수 threshold 설정
  return maxScore >= 0.6 ? maxIntent : 'unknown';
}

// 응답 생성 함수
async function generateResponse(intent, message, attraction, weatherData, nearbyAttractions) {
  try {
    // 이전 응답을 저장할 컨텍스트 객체
    const context = {
      lastIntent: null,
      lastAttraction: null,
      responseCount: 0
    };

    // 기본 응답 템플릿
    const responses = {
      unknown: [
        "죄송합니다. 질문을 이해하지 못했어요. 다른 방식으로 물어봐주시겠어요?",
        "무슨 말씀이신지 잘 모르겠어요. 좀 더 구체적으로 말씀해주시겠어요?",
        "다시 한 번 말씀해주시겠어요? 더 자세히 알려주시면 도움이 될 것 같아요."
      ],
      greeting: [
        "안녕하세요! 무엇을 도와드릴까요?",
        "반갑습니다! 관광지에 대해 궁금하신 점을 물어보세요.",
        "어서오세요! 위치, 날씨, 주변 관광지 등을 물어보실 수 있어요."
      ],
      weather: (data) => {
        if (!data) return "죄송합니다. 현재 날씨 정보를 가져올 수 없습니다.";
        
        let response = `현재 기온은 ${data.temperature}°C이고, ${data.description}입니다.`;
        
        if (data.feelsLike) {
          response += ` 체감온도는 ${data.feelsLike}°C,`;
        }
        
        response += ` 습도는 ${data.humidity}%입니다.`;
        
        if (data.windSpeed) {
          response += ` 풍속은 ${data.windSpeed}m/s입니다.`;
        }
        
        // 날씨에 따른 추천 메시지
        const weatherTips = {
          'Clear': '날씨가 맑아서 야외 활동하기 좋은 날이에요!',
          'Clouds': '구름이 있지만 산책하기 좋은 날씨네요.',
          'Rain': '우산을 챙기시는 것이 좋겠어요.',
          'Snow': '눈이 오니 미끄러운 길 조심하세요.',
          'Thunderstorm': '천둥번개가 치니 실내 활동을 추천드려요.',
          'Mist': '안개가 있으니 야외 활동 시 주의하세요.',
          'Fog': '안개가 있으니 야외 활동 시 주의하세요.',
          'Haze': '연무가 있으니 마스크 착용을 권장드려요.'
        };
        
        if (weatherTips[data.condition]) {
          response += ` ${weatherTips[data.condition]}`;
        }
        
        return response;
      },
      nearby: (attractions) => {
        if (!attractions || !attractions.success || attractions.attractions.length === 0) {
          return "주변에 추천할 만한 관광지를 찾지 못했어요.";
        }
        const attractionList = attractions.attractions
          .slice(0, 3)
          .map(a => `${a.name}(${a.distance}km)`)
          .join(', ');
        return `주변 관광지로는 ${attractionList} 등이 있어요.`;
      }
    };

    // 컨텍스트 기반 응답 생성
    let response = "";
    
    switch (intent) {
      case 'greeting':
        response = responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
        break;
        
      case 'weather':
        response = responses.weather(weatherData);
        break;
        
      case 'nearby':
        response = responses.nearby(nearbyAttractions);
        break;
        
      case 'unknown':
      default:
        response = responses.unknown[Math.floor(Math.random() * responses.unknown.length)];
        break;
    }

    // 컨텍스트 업데이트
    context.lastIntent = intent;
    context.lastAttraction = attraction;
    context.responseCount++;

    return {
      response,
      context
    };
  } catch (error) {
    console.error('응답 생성 중 오류 발생:', error);
    throw new Error('응답을 생성하는 중 오류가 발생했습니다.');
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

    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: '메시지가 필요합니다.' 
      });
    }

    // 사용자 좌표
    const userCoordinates = longitude && latitude ? { longitude, latitude } : null;
    
    // 선택된 관광지 정보 가져오기
    let selectedAttraction = null;
    if (attractionId) {
      try {
        selectedAttraction = await findAttraction(attractionId);
      } catch (error) {
        console.error('관광지 정보 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '관광지 정보를 가져오는 중 오류가 발생했습니다.'
        });
      }
    }
    
    // 메시지 의도 분석
    const intent = analyzeIntent(message);
    
    // 필요한 데이터 수집
    let weatherData = null;
    let nearbyAttractions = [];
    
    if (intent === 'weather' && userCoordinates) {
      try {
        weatherData = await fetchWeather(userCoordinates.longitude, userCoordinates.latitude);
      } catch (error) {
        console.error('날씨 정보 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '날씨 정보를 가져오는 중 오류가 발생했습니다.'
        });
      }
    }
    
    if (intent === 'nearby' && userCoordinates) {
      try {
        nearbyAttractions = await findNearbyAttractions(
          userCoordinates.longitude,
          userCoordinates.latitude,
          weatherData?.condition || 'Clear'
        );
      } catch (error) {
        console.error('주변 관광지 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '주변 관광지 정보를 가져오는 중 오류가 발생했습니다.'
        });
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
        nearbyAttractions: nearbyAttractions
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