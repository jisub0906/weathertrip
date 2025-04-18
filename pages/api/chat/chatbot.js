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

    return data.data;
  } catch (error) {
    console.error('날씨 데이터 가져오기 실패:', error);
    // 기본 날씨 데이터 반환
    return getDefaultWeather();
  }
}

// 기본 날씨 데이터
function getDefaultWeather() {
  return {
    temperature: 23,
    humidity: 65,
    windSpeed: 2.5,
    condition: "Clear",
    sky: "맑음",
    precipitation: "없음",
    recommendedType: "outdoor",
    isBackupData: true
  };
}

// 주변 관광지 찾기 함수
async function findNearbyAttractions(longitude, latitude, weatherCondition, radius = 5) {
  try {
    // 내부 attractions API 호출
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/attractions?longitude=${longitude}&latitude=${latitude}&weatherCondition=${weatherCondition}&radius=${radius}`, 
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`관광지 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.attractions || [];
  } catch (error) {
    console.error('주변 관광지 검색 오류:', error);
    return [];
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
  const intents = {
    greeting: /안녕|반가워|하이|헬로|시작|처음|도움|뭐.*(할|알|도움).*수/.test(lowerMessage),
    weather: /날씨|기온|온도|덥|추|맑|흐림|비|눈|우산|더운가|추운가/.test(lowerMessage),
    location: /어디|위치|주소|찾아가|가는.*(방법|길)|오시|길|네비|지도/.test(lowerMessage),
    description: /뭐|무엇|어떤|특징|설명|알려|소개|정보/.test(lowerMessage),
    operatingHours: /시간|언제|오픈|영업|열어|문|닫아|휴무|휴일/.test(lowerMessage),
    price: /가격|요금|입장료|비용|얼마|돈/.test(lowerMessage),
    nearby: /주변|근처|가까운|다른.*관광지|추천|볼.*것|볼거리/.test(lowerMessage),
    transport: /교통|버스|지하철|차|택시|주차/.test(lowerMessage),
    thanks: /고마워|감사|땡큐|thank/.test(lowerMessage),
    activities: /뭐.*하|할.*거|체험|액티비티|프로그램|즐길/.test(lowerMessage),
    foodNearby: /맛집|음식점|식당|뭐.*먹|먹을.*곳|카페/.test(lowerMessage)
  };
  
  // 가장 높은 점수의 의도 찾기
  let maxIntent = null;
  let maxScore = 0;
  
  for (const [intent, regex] of Object.entries(intents)) {
    const score = regex ? 1 : 0;
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent;
    }
  }
  
  return maxIntent || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { message, attractionId, longitude, latitude } = req.body;

    if (!message) {
      return res.status(400).json({ message: '메시지가 필요합니다.' });
    }

    // 사용자 좌표
    const userCoordinates = longitude && latitude ? { longitude, latitude } : null;
    
    // 선택된 관광지 정보 가져오기
    let selectedAttraction = null;
    if (attractionId) {
      selectedAttraction = await findAttraction(attractionId);
    }
    
    // 메시지에서 관광지명 인식
    const mentionedAttraction = await identifyAttraction(message);
    const attraction = mentionedAttraction || selectedAttraction;
    
    // 메시지 의도 분석
    const intent = analyzeIntent(message);
    
    // 응답 생성에 필요한 추가 데이터
    let weatherData = null;
    let nearbyAttractions = [];
    let additionalData = {};
    
    // 날씨 관련 질문인 경우 날씨 데이터 가져오기
    if (intent === 'weather') {
      if (userCoordinates) {
        weatherData = await fetchWeather(userCoordinates.longitude, userCoordinates.latitude);
      } else if (attraction && attraction.location && attraction.location.coordinates) {
        weatherData = await fetchWeather(
          attraction.location.coordinates[0], 
          attraction.location.coordinates[1]
        );
      } else {
        // 기본 날씨 (서울 기준)
        weatherData = await fetchWeather(126.9780, 37.5665);
      }
      additionalData.weather = weatherData;
    }
    
    // 주변 관광지 관련 질문인 경우
    if (intent === 'nearby') {
      if (userCoordinates) {
        nearbyAttractions = await findNearbyAttractions(
          userCoordinates.longitude, 
          userCoordinates.latitude,
          weatherData?.condition || 'Clear'
        );
      } else if (attraction && attraction.location && attraction.location.coordinates) {
        nearbyAttractions = await findNearbyAttractions(
          attraction.location.coordinates[0],
          attraction.location.coordinates[1],
          weatherData?.condition || 'Clear'
        );
      }
      additionalData.nearbyAttractions = nearbyAttractions;
    }

    // 의도와 상황에 따른 응답 생성
    let responseContent = '';
    
    if (attraction) {
      // 특정 관광지에 대한 질문
      switch (intent) {
        case 'greeting':
          responseContent = `안녕하세요! ${attraction.name}에 대해 무엇이든 물어보세요.`;
          break;
        case 'location':
          responseContent = `${attraction.name}은(는) ${attraction.address}에 위치해 있습니다. 찾아가실 때 도움이 필요하시면 말씀해주세요.`;
          break;
        case 'description':
          responseContent = `${attraction.name}은(는) ${attraction.description || '자세한 정보가 아직 등록되지 않았습니다.'}`;
          break;
        case 'operatingHours':
          responseContent = `${attraction.name}의 영업 시간은 ${attraction.operatingHours || '정보가 등록되지 않았습니다.'}`;
          break;
        case 'price':
          responseContent = `${attraction.name}의 입장료는 ${attraction.entranceFee || '정보가 등록되지 않았습니다.'}`;
          break;
        case 'weather':
          const weather = weatherData;
          responseContent = `${attraction.name} 주변의 현재 날씨는 ${weather.temperature}°C, ${weather.sky}입니다. 습도는 ${weather.humidity}%이며 풍속은 ${weather.windSpeed}m/s입니다.`;
          break;
        case 'nearby':
          if (nearbyAttractions.length > 0) {
            const top3 = nearbyAttractions.slice(0, 3).map(attr => 
              `${attr.name} (${attr.distanceKm.toFixed(1)}km)`
            ).join(', ');
            responseContent = `${attraction.name} 주변 관광지로는 ${top3} 등이 있습니다. 더 알고 싶은 곳이 있으신가요?`;
          } else {
            responseContent = `${attraction.name} 주변 5km 이내에 등록된 다른 관광지가 없습니다.`;
          }
          break;
        case 'transport':
          responseContent = `${attraction.name}으로 가는 방법은 대중교통, 자가용, 택시 등 다양합니다. 자세한 교통편을 알려드릴까요?`;
          break;
        case 'activities':
          if (attraction.tags && Array.isArray(attraction.tags) && attraction.tags.includes('체험')) {
            responseContent = `${attraction.name}에서는 다양한 체험 활동을 즐길 수 있습니다. 특히 도자기 만들기 체험이 인기가 많습니다.`;
          } else {
            responseContent = `${attraction.name}에서는 주로 관람 및 둘러보는 활동을 즐길 수 있습니다. 특별한 체험 프로그램은 현장에서 확인하시는 것이 좋습니다.`;
          }
          break;
        case 'foodNearby':
          responseContent = `${attraction.name} 주변에는 다양한 맛집이 있습니다. 특별히 찾으시는 음식 종류가 있으신가요?`;
          break;
        case 'thanks':
          responseContent = '도움이 되어 기쁩니다! 더 궁금한 점이 있으시면 언제든지 물어보세요.';
          break;
        default:
          responseContent = `${attraction.name}에 대해 더 알고 싶으시다면, 위치, 영업시간, 입장료, 주변 관광지 등에 대해 물어보세요!`;
      }
    } else {
      // 일반적인 질문 (특정 관광지 없음)
      switch (intent) {
        case 'greeting':
          responseContent = '안녕하세요! 관광 정보를 찾고 계신가요? 어떤 관광지에 관심이 있으신지 알려주세요.';
          break;
        case 'weather':
          if (weatherData) {
            responseContent = `현재 날씨는 ${weatherData.temperature}°C, ${weatherData.sky}입니다. 습도는 ${weatherData.humidity}%이며 풍속은 ${weatherData.windSpeed}m/s입니다.`;
          } else {
            responseContent = '현재 날씨 정보를 확인할 수 없습니다. 특정 지역의 날씨를 알고 싶으시면 지역명을 함께 알려주세요.';
          }
          break;
        case 'nearby':
          if (userCoordinates && nearbyAttractions.length > 0) {
            const top5 = nearbyAttractions.slice(0, 5).map(attr => 
              `${attr.name} (${attr.distanceKm.toFixed(1)}km)`
            ).join('\n- ');
            responseContent = `주변 관광지 추천입니다:\n- ${top5}`;
          } else {
            responseContent = '주변 관광지를 찾으려면 위치 접근 권한을 허용해 주시거나, 특정 관광지나 지역명을 알려주세요.';
          }
          break;
        case 'thanks':
          responseContent = '천만에요! 더 필요한 정보가 있으시면 언제든지 물어보세요.';
          break;
        default:
          responseContent = '무엇을 도와드릴까요? 특정 관광지에 대한 정보, 날씨, 주변 관광지 등을 물어보실 수 있어요.';
      }
    }

    // 응답 반환
    return res.status(200).json({
      success: true,
      response: responseContent,
      additionalData
    });

  } catch (error) {
    console.error('챗봇 서비스 오류:', error);
    return res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.', 
      error: error.message 
    });
  }
}