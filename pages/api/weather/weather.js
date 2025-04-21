import { convertToGrid } from '../../../utils/coordinates';
import { classifyWeatherCondition, getSkyStatusText, getPrecipitationText } from '../../../utils/weather';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { longitude, latitude } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: '위도와 경도가 필요합니다.' });
    }
    
    console.log('날씨 API 요청 수신:', { longitude, latitude });
    
    // Mock 데이터 - API 연결 문제시 테스트용
    const mockWeatherData = {
      temperature: 23,
      humidity: 65,
      windSpeed: 2.5,
      condition: "Clear", // Clear, Clouds, Rain, Snow
      sky: "맑음",
      precipitation: "없음",
      recommendedType: "outdoor",
      baseDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      baseTime: String(new Date().getHours()).padStart(2, '0') + '30',
    };
    
    // 개발 모드에서 Mock 데이터 사용 옵션
    if (process.env.USE_MOCK_WEATHER === 'true') {
      console.log('Mock 날씨 데이터 사용');
      return res.status(200).json({ success: true, data: mockWeatherData });
    }
    
    // 좌표 변환
    const grid = convertToGrid(parseFloat(longitude), parseFloat(latitude));
    console.log('기상청 좌표로 변환:', grid);
    
    // 현재 시간 기준으로 가장 최근 발표 시간 계산
    const now = new Date();
    const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 매시간 30분에 발표, 45분 이후 조회 가능
    let baseTime;
    
    if (minute < 45) {
      // 이전 시간의 데이터 사용
      const prevHour = hour === 0 ? 23 : hour - 1;
      baseTime = String(prevHour).padStart(2, '0') + '30';
    } else {
      baseTime = String(hour).padStart(2, '0') + '30';
    }
    
    // API 키
    const apiKey = process.env.WEATHER_API_KEY_ENCODED;
    
    if (!apiKey) {
      console.error('날씨 API 키가 설정되지 않았습니다.');
      return res.status(500).json({ 
        message: '서버 설정 오류: API 키가 없습니다.', 
        success: false 
      });
    }
    
    // API URL 구성 - 초단기예보 사용
    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${grid.nx}&ny=${grid.ny}`;
    
    console.log('날씨 API 요청 URL:', url);
    
    try {
      const response = await fetch(url, { method: 'GET' });
      
      if (!response.ok) {
        console.error('날씨 API 응답 오류:', response.status, response.statusText);
        throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('날씨 API 응답 헤더:', data.response?.header);
      
      if (data.response?.header?.resultCode !== "00") {
        throw new Error(`API 오류: ${data.response?.header?.resultMsg || '알 수 없는 오류'}`);
      }
      
      // 날씨 정보 파싱 및 가공
      const items = data.response.body.items.item;
      
      // 시간별 그룹화
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
        console.error('날씨 데이터가 없습니다.');
        return res.status(500).json({ message: '날씨 데이터를 가져올 수 없습니다.' });
      }
      
      const currentData = timeGroups[timeKeys[0]];
      console.log('날씨 데이터 항목:', Object.keys(currentData));
      
      // 필수 데이터 체크
      if (!currentData.SKY || !currentData.PTY) {
        console.error('필수 날씨 데이터가 없습니다:', currentData);
        throw new Error('날씨 정보 누락: 하늘상태 또는 강수형태 데이터가 없습니다');
      }
      
      // 날씨 상태 분류
      const weatherCondition = classifyWeatherCondition(
        currentData.SKY, 
        currentData.PTY
      );
      
      // 응답 데이터 구성
      const weatherInfo = {
        temperature: parseFloat(currentData.T1H || 0),
        feelsLike: parseFloat(currentData.T1H || 0) - (parseFloat(currentData.WSD || 0) > 1.5 ? 2 : 0), // 체감온도 계산
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
        grid: grid  // 디버깅 용도
      };
      
      console.log('응답 날씨 정보:', weatherInfo);
      return res.status(200).json({ success: true, data: weatherInfo });
    } catch (fetchError) {
      console.error('날씨 API 호출 중 오류:', fetchError);
      
      // API 호출 실패시 Mock 데이터 반환
      const mockWeatherData = {
        temperature: 23,
        feelsLike: 25,
        humidity: 65,
        windSpeed: 2.5,
        condition: "Clear",
        description: "맑음",
        icon: "01d",
        recommendedType: "outdoor",
        isBackupData: true
      };
      
      console.log('API 실패, Mock 데이터 반환');
      return res.status(200).json({ 
        success: true, 
        data: mockWeatherData,
        isBackupData: true
      });
    }
  } catch (error) {
    console.error('날씨 데이터 처리 오류:', error);
    
    // 오류 발생시 Mock 데이터 반환
    const mockWeatherData = {
      temperature: 23,
      feelsLike: 25,
      humidity: 65,
      windSpeed: 2.5,
      condition: "Clear",
      description: "맑음",
      icon: "01d",
      recommendedType: "outdoor",
      isBackupData: true
    };
    
    return res.status(200).json({ 
      success: true, 
      data: mockWeatherData,
      error: error.message,
      isBackupData: true
    });
  }
}

// 날씨 아이콘 코드 반환 함수
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