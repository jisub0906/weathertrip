import axios from 'axios';

/**
 * 여행지 추천 문장 생성 API 라우트 핸들러
 * - POST: 날씨, 온도, 추천 유형 등 조건에 따라 AI 기반 감성 추천 문장 생성
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(추천 문장)
 */
export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 요청 바디에서 추천 조건 추출
    const { weatherCondition, temperature, recommendationType, category } = req.body;
    
    console.log('Request data:', { weatherCondition, temperature, recommendationType, category });

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    // 날씨 상태를 한글로 변환하는 매핑 객체
    const weatherInKorean = {
      Clear: '맑음',
      Clouds: '흐림',
      Rain: '비',
      Snow: '눈'
    }[weatherCondition] || '알 수 없음';

    /**
     * 실내/야외 추천 유형에 따라 추천 카테고리 문자열 반환
     * @param type - 추천 유형(실내/야외/전체)
     * @returns 추천 카테고리 문자열
     */
    const getRecommendedCategories = (type) => {
      if (type === '실내') {
        return '문화/예술 또는 체험/학습/산업';
      } else if (type === '야외') {
        return '자연/힐링, 종교/역사/전통, 또는 캠핑/스포츠';
      }
      return '다양한 장소';
    };

    // 추천 카테고리 결정
    const recommendedCategories = getRecommendedCategories(recommendationType);

    /**
     * AI 프롬프트: 조건에 맞는 감성적 추천 문장 생성을 위한 상세 지침
     */
    const prompt = `
현재 날씨: ${weatherInKorean}, 온도: ${temperature}°C
추천 유형: ${recommendationType === '전체' ? '실내/야외' : recommendationType}
추천 카테고리: ${recommendedCategories}

날씨와 실내/외 구분을 고려하여 여행객에게 적합한 관광지 유형과 활동을 추천해주세요. 
${recommendationType === '실내' ? '실내에서 즐길 수 있는 문화/예술이나 체험/학습 활동을 중심으로 추천해주세요.' : 
  recommendationType === '야외' ? '야외에서 즐길 수 있는 자연/힐링, 역사 유적지, 또는 스포츠 활동을 중심으로 추천해주세요.' : 
  '날씨를 고려하여 적절한 실내/외 활동을 추천해주세요.'}

 작성 규칙:
1. 문장은 40자 이하로 구성합니다.
2. 문장은 한국어로 감성적이지만 이해하기 쉬운 말투로 작성해 주세요.
3. 문장의 시작은 **날씨에 대한 감정 표현**으로 시작합니다. 예: "흐린 날엔", "맑은 하늘 아래엔"
4. 문장의 끝은 **카테고리에 해당하는 장소/활동으로 마무리**해주세요.  
   예: "숲길을 걸으며 여유를 찾아보세요", "사찰에서 고요함을 느껴보세요"
5. 문장 맨 앞과 맨 뒤에 이모지를 1개씩만 넣습니다. (총 2개)
6. **의미 없는 말(예: '순쾅히는', '비늘이') 또는 시간 표현(아침, 밤 등)은 사용하지 않습니다.**

 카테고리 연관 예시:
- 자연/힐링 → 숲길, 바다, 산책로, 휴식
- 종교/역사/전통 → 사찰, 고궁, 전통시장
- 체험/학습/산업 → 체험마을, 박물관
- 문화/예술 → 미술관, 전시회
- 캠핑/스포츠 → 캠핑장, 자전거 타기

 예시 문장:
- ☁️ 흐린 날엔 고요한 사찰에서 마음을 비워보세요 🌿  
- 🌞 햇살 좋은 날엔 산책로를 따라 여유를 느껴보세요 🍃  

이제 조건에 맞는 문장 1개를 만들어주세요. `;

    console.log('Sending request to OpenRouter API with key:', process.env.OPENROUTER_API_KEY.substring(0, 10) + '...');

    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Weather Trip Recommendation',
        'Content-Type': 'application/json'
      },
      data: {
        model: "mistralai/mistral-tiny",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
        stream: false
      },
      timeout: 30000
    });

    console.log('API Response:', {
      status: response.status,
      data: response.data
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const recommendation = response.data.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      recommendation
    });

  } catch (error) {
    /**
     * 에러 상황별 사용자 메시지 분기 처리
     * - API 키 미설정, 인증 오류, 요청 초과, 네트워크 오류 등
     */
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });

    // API 응답의 실제 에러 메시지 확인
    const apiErrorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message;

    console.log('API Error Message:', apiErrorMessage);

    let errorMessage = '여행 추천을 생성하는 중 오류가 발생했습니다.';

    if (!process.env.OPENROUTER_API_KEY) {
      errorMessage = 'API 키가 설정되지 않았습니다.';
    } else if (error.response?.status === 401) {
      errorMessage = 'API 키가 유효하지 않습니다. 관리자에게 문의하세요.';
    } else if (error.response?.status === 429) {
      errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '요청 시간이 초과되었습니다.';
    } else if (apiErrorMessage) {
      errorMessage = `API 오류: ${apiErrorMessage}`;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      details: error.response?.data || error.message
    });
  }
} 