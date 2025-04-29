/**
 * 기상청 하늘상태 코드(1,3,4 등)를 한글 텍스트로 변환
 * @param {number|string} code - 하늘상태 코드
 * @returns {string} 하늘상태 한글 텍스트(맑음, 구름많음, 흐림 등)
 */
export function getSkyStatusText(code) {
  switch (parseInt(code)) {
    case 1: return "맑음";
    case 3: return "구름많음";
    case 4: return "흐림";
    default: return "알 수 없음";
  }
}

/**
 * 기상청 강수형태 코드(0~7 등)를 한글 텍스트로 변환
 * @param {number|string} code - 강수형태 코드
 * @returns {string} 강수형태 한글 텍스트(비, 눈, 없음 등)
 */
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

/**
 * 기상청 API 응답 코드(하늘상태, 강수형태)를 앱에서 사용하는 날씨 상태로 분류
 * @param {number|string} skyCode - 하늘상태 코드
 * @param {number|string} ptyCode - 강수형태 코드
 * @returns {string} 날씨 상태(Clear, Clouds, Rain, Snow)
 */
export function classifyWeatherCondition(skyCode, ptyCode) {
  const sky = parseInt(skyCode);
  const pty = parseInt(ptyCode);
  // 강수가 있는 경우 - 비/눈/혼합형 구분
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
  // 기본값(예외 상황)도 맑음 처리
  return "Clear";
}

/**
 * 날씨 상태(Clear, Clouds, Rain, Snow 등)에 따라 추천 관광지 타입 반환
 * @param {string} weatherCondition - 날씨 상태
 * @returns {string} 추천 관광지 타입('outdoor', 'indoor', 'both')
 */
export function getRecommendedAttractionType(weatherCondition) {
  switch (weatherCondition) {
    case "Clear":   return "outdoor";  // 맑음 -> 야외 관광지 추천
    case "Clouds":  return "both";     // 흐림 -> 실내/야외 모두 추천
    case "Rain":    return "indoor";   // 비 -> 실내 관광지 추천
    case "Snow":    return "indoor";   // 눈 -> 실내 관광지 추천
    default:        return "both";     // 기본값은 모두 추천
  }
} 