import { useState, useEffect } from 'react';

/**
 * [목적] IP 주소 기반으로 사용자 위치 정보를 조회하는 비동기 함수
 * @returns { latitude, longitude, city, country, source } 또는 기본값(서울)
 */
async function fetchLocationByIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.error) {
      throw new Error(data.reason || 'IP 위치 조회 실패');
    }
    // 성공적으로 위치 정보를 받은 경우 좌표와 도시/국가 정보 반환
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      country: data.country_name,
      source: 'ip'
    };
  } catch (error) {
    // 최종 폴백: 서울 좌표
    return {
      latitude: 37.5665,
      longitude: 126.9780,
      city: 'Seoul',
      country: 'South Korea',
      source: 'default'
    };
  }
}

/**
 * [목적] 좌표를 주소로 변환 (카카오맵 API 사용)
 * @param latitude - 위도
 * @param longitude - 경도
 * @returns { roadAddress, jibunAddress, displayAddress } 또는 null
 */
async function getAddressFromCoords(latitude, longitude) {
  if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
    return null;
  }
  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(longitude, latitude, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        if (result[0]) {
          const addressObj = result[0];
          const roadAddr = addressObj.road_address ? addressObj.road_address.address_name : null;
          const jibunAddr = addressObj.address ? addressObj.address.address_name : null;
          resolve({
            roadAddress: roadAddr,
            jibunAddress: jibunAddr,
            displayAddress: roadAddr || jibunAddr || null
          });
        } else {
          resolve(null);
        }
      } else {
        reject(new Error('주소 변환 실패'));
      }
    });
  });
}

/**
 * 사용자 위치(좌표/주소) 및 로딩/에러 상태를 반환하는 커스텀 훅
 * @returns { location, error, loading, source, address }
 */
export default function useLocation() {
  // 위치 정보 상태
  const [location, setLocation] = useState(null);
  // 에러 메시지 상태
  const [error, setError] = useState(null);
  // 로딩 상태
  const [loading, setLoading] = useState(true);
  // 위치 정보 소스(geolocation/ip/default)
  const [source, setSource] = useState(null);
  // 좌표 → 주소 변환 결과
  const [address, setAddress] = useState(null);

  /**
   * [목적] 좌표가 변경될 때마다 카카오맵 API로 주소를 역지오코딩
   */
  useEffect(() => {
    if (!location || typeof window === 'undefined') return;
    // 카카오맵 API가 로드될 때까지 polling
    const checkKakaoAndGetAddress = async () => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        setTimeout(checkKakaoAndGetAddress, 1000);
        return;
      }
      try {
        const addr = await getAddressFromCoords(location.latitude, location.longitude);
        setAddress(addr);
      } catch (err) {
        // 주소 변환 실패 시 무시
      }
    };
    checkKakaoAndGetAddress();
  }, [location]);

  /**
   * [목적] 컴포넌트 마운트 시 사용자 위치(좌표) 탐색 및 상태 저장
   * [의도] 1. Geolocation → 2. IP → 3. 기본값 순으로 시도
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    async function getLocation() {
      // 1. 브라우저 Geolocation API 시도
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000
            });
          });
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: '',
            country: '',
            source: 'geolocation'
          });
          setSource('geolocation');
          setLoading(false);
          return;
        } catch (geoError) {
          // Geolocation 실패 시 IP 기반으로 폴백
        }
      }
      // 2. IP 기반 위치정보 폴백 - 여러 서비스 시도
      try {
        let ipLocation = await fetchLocationByIP();
        // IP 위치가 명확하지 않은 경우(기본값과 같은 경우) 다른 서비스 시도
        if (ipLocation.source === 'default') {
          try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            if (data && data.loc) {
              const [lat, lon] = data.loc.split(',');
              ipLocation = {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                city: data.city || '',
                country: data.country || '',
                source: 'ip-alternative'
              };
            }
          } catch (alternativeError) {
            // 대체 IP 위치 서비스 실패 시 무시
          }
        }
        setLocation(ipLocation);
        setSource(ipLocation.source);
        setLoading(false);
      } catch (ipError) {
        setError('위치 정보를 가져올 수 없습니다.');
        // 최종 폴백: 서울 좌표
        setLocation({
          latitude: 37.5665,
          longitude: 126.9780,
          city: 'Seoul',
          country: 'South Korea',
          source: 'default'
        });
        setSource('default');
        setLoading(false);
      }
    }
    getLocation();
  }, []);

  return { location, error, loading, source, address };
} 