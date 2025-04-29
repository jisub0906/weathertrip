/**
 * 위도/경도(WGS84) 좌표를 기상청 격자(nx, ny) 좌표로 변환
 * - 기상청 단기예보 API 등에서 요구하는 격자 좌표계로 변환할 때 사용
 * @param {number} lon - 경도(Longitude)
 * @param {number} lat - 위도(Latitude)
 * @returns {{nx: number, ny: number}} 변환된 격자 좌표(nx, ny)
 */
export function convertToGrid(lon, lat) {
  // 기상청 격자 변환에 사용되는 주요 상수 (공식 문서 기준)
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0;      // 격자 간격(km)
  const SLAT1 = 30.0;    // 투영 위도1(도)
  const SLAT2 = 60.0;    // 투영 위도2(도)
  const OLON = 126.0;    // 기준점 경도(도)
  const OLAT = 38.0;     // 기준점 위도(도)
  const XO = 210 / GRID; // 기준점 X좌표
  const YO = 675 / GRID; // 기준점 Y좌표

  // 각종 변환에 필요한 수학 상수
  const PI = Math.asin(1.0) * 2.0;
  const DEGRAD = PI / 180.0; // 도 -> 라디안 변환 상수
  const RADDEG = 180.0 / PI; // 라디안 -> 도 변환 상수

  // 격자 변환 공식에 필요한 중간값 계산
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  // 투영에 필요한 sn, sf, ro 계산 (기상청 공식)
  let sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  // 입력 위경도(lon, lat)를 격자계로 변환
  let ra = Math.tan(PI * 0.25 + lat * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  // -PI ~ PI 범위로 보정 (경도 차이 보정)
  if (theta > PI) theta -= 2.0 * PI;
  if (theta < -PI) theta += 2.0 * PI;
  theta *= sn;

  // 최종 격자 좌표 계산
  const x = ra * Math.sin(theta) + XO;
  const y = ro - ra * Math.cos(theta) + YO;

  // 기상청 API 요구에 맞게 소수점 보정 및 반환
  return {
    nx: Math.floor(x + 1.5), // X좌표(격자)
    ny: Math.floor(y + 1.5)  // Y좌표(격자)
  };
} 