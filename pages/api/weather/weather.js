import { convertToGrid } from '../../../utils/coordinates';
import { classifyWeatherCondition, getSkyStatusText, getPrecipitationText } from '../../../utils/weather';
import { parseString } from 'xml2js';

/**
 * 외부 기상청 API를 활용한 날씨 정보 조회 API 라우트 핸들러
 * - GET: 위도/경도를 받아 실시간 날씨 정보를 반환(개발 모드에서는 Mock 데이터)
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(날씨 정보 또는 에러)
 */
// 재시도 함수: 외부 API 호출 실패 시 최대 N회까지 재시도(지수 백오프 적용)
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      // 재시도: 응답이 실패일 경우 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      // 네트워크 오류 등 예외 발생 시 마지막 시도까지 반복
      if (i === maxRetries - 1) throw error;
    }
  }
  throw new Error('최대 재시도 횟수 초과');
}

export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    // 쿼리에서 위도/경도 추출
    const { longitude, latitude } = req.query;
    if (!longitude || !latitude) {
      return res.status(400).json({ message: '위도와 경도가 필요합니다.' });
    }

    // 개발 모드 또는 API 키 미설정 시 Mock 데이터 반환
    const mockWeatherData = {
      temperature: 23,
      humidity: 65,
      windSpeed: 2.5,
      condition: "Clear",
      sky: "맑음",
      precipitation: "없음",
      recommendedType: "outdoor",
      baseDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      baseTime: String(new Date().getHours()).padStart(2, '0') + '30',
    };
    if (process.env.NODE_ENV === 'development' || !process.env.WEATHER_API_KEY_ENCODED) {
      return res.status(200).json({ success: true, data: mockWeatherData });
    }

    // 위경도 → 기상청 격자 좌표 변환
    const grid = convertToGrid(parseFloat(longitude), parseFloat(latitude));

    // 기상청 발표 기준일/시간 계산(매시 30분 기준, 45분 이후 최신 데이터)
    const now = new Date();
    const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const hour = now.getHours();
    const minute = now.getMinutes();
    let baseTime;
    if (minute < 45) {
      const prevHour = hour === 0 ? 23 : hour - 1;
      baseTime = String(prevHour).padStart(2, '0') + '30';
    } else {
      baseTime = String(hour).padStart(2, '0') + '30';
    }

    // 기상청 API 키
    const apiKey = process.env.WEATHER_API_KEY_ENCODED;
    if (!apiKey) {
      return res.status(500).json({ 
        message: '서버 설정 오류: API 키가 없습니다.', 
        success: false 
      });
    }

    // 기상청 초단기예보 API URL 구성
    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${grid.nx}&ny=${grid.ny}`;

    try {
      // 외부 API 호출(재시도 포함)
      const response = await fetchWithRetry(url, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // 응답 Content-Type에 따라 파싱(JSON/XML)
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/xml')) {
        const text = await response.text();
        data = await new Promise((resolve, reject) => {
          parseString(text, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      } else {
        throw new Error('지원하지 않는 응답 형식입니다.');
      }

      // 기상청 API 정상 응답 여부 확인
      if (!data.response?.header || data.response?.header?.resultCode !== "00") {
        throw new Error('API 응답 오류: ' + (data.response?.header?.resultMsg || '알 수 없는 오류'));
      }

      // 시간별 예보 데이터 그룹화
      const items = data.response.body.items.item;
      const timeGroups = {};
      items.forEach(item => {
        const timeKey = `${item.fcstDate}-${item.fcstTime}`;
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = {};
        }
        timeGroups[timeKey][item.category] = item.fcstValue;
      });

      // 가장 빠른 시간의 예보 데이터 사용
      const timeKeys = Object.keys(timeGroups).sort();
      if (timeKeys.length === 0) {
        throw new Error('날씨 데이터가 없습니다.');
      }
      const currentData = timeGroups[timeKeys[0]];

      // 필수 데이터(SKY, PTY) 누락 시 에러
      if (!currentData.SKY || !currentData.PTY) {
        throw new Error('날씨 정보 누락: 하늘상태 또는 강수형태 데이터가 없습니다');
      }

      // 날씨 상태 분류(맑음/구름/비/눈 등)
      const weatherCondition = classifyWeatherCondition(
        currentData.SKY, 
        currentData.PTY
      );

      // 최종 응답 데이터 구성
      const weatherInfo = {
        temperature: parseFloat(currentData.T1H || 0),
        feelsLike: parseFloat(currentData.T1H || 0) - (parseFloat(currentData.WSD || 0) > 1.5 ? 2 : 0),
        sky: getSkyStatusText(currentData.SKY),
        precipitation: getPrecipitationText(currentData.PTY),
        humidity: parseInt(currentData.REH || 0),
        windSpeed: parseFloat(currentData.WSD || 0),
        condition: weatherCondition,
        description: getSkyStatusText(currentData.SKY),
        icon: getWeatherIcon(weatherCondition),
        recommendedType: weatherCondition === "Clear" ? "outdoor" : 
                      weatherCondition === "Clouds" ? "both" : "indoor",
        baseDate: baseDate,
        baseTime: baseTime,
        fcstDate: timeKeys[0].split('-')[0],
        fcstTime: timeKeys[0].split('-')[1],
        grid: grid
      };

      return res.status(200).json({ success: true, data: weatherInfo });
    } catch (error) {
      // 외부 API 호출 또는 파싱 중 오류 발생 시
      return res.status(500).json({ 
        success: false, 
        message: '날씨 정보를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
        error: error.message
      });
    }
  } catch (error) {
    // 전체 핸들러 레벨의 예외 처리
    return res.status(500).json({ 
      success: false, 
      message: '날씨 정보를 처리하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

/**
 * 날씨 상태(맑음/구름/비/눈 등)에 따른 아이콘 코드 반환
 * @param condition - 날씨 상태 문자열
 * @returns string - 아이콘 코드
 */
function getWeatherIcon(condition) {
  const icons = {
    'Clear': '01d',
    'Clouds': '03d',
    'Rain': '10d',
    'Snow': '13d',
    'Thunderstorm': '11d',
    'Drizzle': '09d',
    'Mist': '50d',
    'Fog': '50d',
    'Haze': '50d'
  };
  return icons[condition] || '01d';
} 