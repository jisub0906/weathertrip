// 위경도 -> 기상청 좌표 변환 함수
export function convertToGrid(lon, lat) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 210 / GRID;
  const YO = 675 / GRID;

  const PI = Math.asin(1.0) * 2.0;
  const DEGRAD = PI / 180.0;
  const RADDEG = 180.0 / PI;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(PI * 0.25 + lat * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > PI) theta -= 2.0 * PI;
  if (theta < -PI) theta += 2.0 * PI;
  theta *= sn;

  const x = ra * Math.sin(theta) + XO;
  const y = ro - ra * Math.cos(theta) + YO;

  return {
    nx: Math.floor(x + 1.5),
    ny: Math.floor(y + 1.5)
  };
} 