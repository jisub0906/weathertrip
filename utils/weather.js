// 하늘상태 코드 해석
export function getSkyStatusText(code) {
  switch (parseInt(code)) {
    case 1: return "맑음";
    case 3: return "구름많음";
    case 4: return "흐림";
    default: return "알 수 없음";
  }
}

// 강수형태 코드 해석
export function getPrecipitationText(code) {
  switch (parseInt(code)) {
    case 0: return "없음";
    case 1: return "비";
    case 2: return "비/눈";
    case 3: return "눈";
    case 5: return "빗방울";
    case 6: return "빗방울눈날림";
    case 7: return "눈날림";
    default: return "알 수 없음";
  }
}

// 기상청 API 응답에서 애플리케이션 요구사항에 맞는 날씨 상태 분류
export function classifyWeatherCondition(skyCode, ptyCode) {
  const sky = parseInt(skyCode);
  const pty = parseInt(ptyCode);
  
  // 강수가 있는 경우 - 비와 눈 구분
  if (pty > 0) {
    // 비 관련 코드 (1: 비, 5: 빗방울)
    if (pty === 1 || pty === 5) return "Rain";
    // 눈 관련 코드 (3: 눈, 7: 눈날림)
    if (pty === 3 || pty === 7) return "Snow";
    // 혼합형 (2: 비/눈, 6: 빗방울눈날림) - 눈으로 처리
    if (pty === 2 || pty === 6) return "Snow";
  }
  
  // 강수가 없는 경우는 하늘상태로 구분
  if (sky === 1) return "Clear";        // 맑음
  if (sky === 3 || sky === 4) return "Clouds";  // 구름많음 또는 흐림
  
  // 기본값
  return "Clear";
}

// 날씨 상태에 따른 관광지 추천 타입
export function getRecommendedAttractionType(weatherCondition) {
  switch (weatherCondition) {
    case "Clear":   return "outdoor";  // 맑음 -> 야외 관광지 추천
    case "Clouds":  return "both";     // 흐림 -> 실내/야외 모두 추천
    case "Rain":    return "indoor";   // 비 -> 실내 관광지 추천
    case "Snow":    return "indoor";   // 눈 -> 실내 관광지 추천
    default:        return "both";     // 기본값은 모두 추천
  }
} 