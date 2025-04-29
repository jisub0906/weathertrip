/**
 * 두 지점 간의 거리를 계산합니다 (Haversine 공식 사용).
 * - 위도/경도를 이용해 구면 거리(최단 거리)를 계산할 때 사용
 * @param {number} lat1 - 시작점의 위도
 * @param {number} lon1 - 시작점의 경도
 * @param {number} lat2 - 도착점의 위도
 * @param {number} lon2 - 도착점의 경도
 * @returns {number} 두 지점 간의 거리 (km)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 지구의 반지름 (km)
  // Haversine 공식 적용: 두 점의 위경도 차이로 거리 계산
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 현재 위치를 기준으로 관광지들의 거리를 계산하고 가까운 순으로 정렬합니다.
 * - 각 관광지 객체에 distance(거리, km) 속성을 추가
 * @param {Array} attractions - 관광지 배열
 * @param {Object} userLocation - 사용자의 현재 위치 {latitude, longitude}
 * @returns {Array} 거리가 계산되고 정렬된 관광지 배열
 */
export const calculateAttractionsDistance = (attractions, userLocation) => {
  if (!userLocation || !attractions) return attractions;

  // 각 관광지에 대해 거리 계산 후, distance 속성 추가
  return attractions.map(attraction => {
    let distance = null;
    // 좌표 정보가 있는 경우에만 거리 계산
    if (userLocation && attraction.location?.coordinates) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        attraction.location.coordinates[1], // 위도
        attraction.location.coordinates[0]  // 경도
      );
    }
    return { ...attraction, distance };
  })
  // 거리 오름차순 정렬 (거리 정보 없는 경우 맨 뒤로)
  .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}; 