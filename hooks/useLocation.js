import { useState, useEffect } from 'react';

// IP 기반 위치정보 취득 (폴백용)
async function fetchLocationByIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'IP 위치 조회 실패');
    }
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      country: data.country_name,
      source: 'ip'
    };
  } catch (error) {
    console.error('IP 위치 조회 오류:', error);
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

// 좌표를 주소로 변환하는 함수 (카카오맵 API 사용)
async function getAddressFromCoords(latitude, longitude) {
  if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
    console.warn('카카오맵 services 라이브러리가 로드되지 않았습니다.');
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

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);
  const [address, setAddress] = useState(null);

  // 좌표를 주소로 변환하는 효과
  useEffect(() => {
    if (!location || typeof window === 'undefined') return;
    
    // 카카오맵 API가 로드될 때까지 대기
    const checkKakaoAndGetAddress = async () => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        // 카카오맵이 아직 로드되지 않았으면 1초 후에 다시 시도
        setTimeout(checkKakaoAndGetAddress, 1000);
        return;
      }
      
      try {
        const addr = await getAddressFromCoords(location.latitude, location.longitude);
        setAddress(addr);
      } catch (err) {
        console.warn('주소 변환 오류:', err);
      }
    };
    
    checkKakaoAndGetAddress();
  }, [location]);

  useEffect(() => {
    // 서버 사이드 렌더링 시 실행 방지
    if (typeof window === 'undefined') return;
    
    async function getLocation() {
      // 1. 브라우저 Geolocation API 시도
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,  // 타임아웃 증가 (15초)
              maximumAge: 300000  // 5분간 캐시된 위치 허용
            });
          });
          
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: '', // 나중에 역지오코딩으로 채울 수 있음
            country: '',
            source: 'geolocation'
          });
          setSource('geolocation');
          setLoading(false);
          return;
        } catch (geoError) {
          console.warn('Geolocation 오류:', geoError.message);
          // Geolocation 실패 시 IP 기반으로 폴백
        }
      }
      
      // 2. IP 기반 위치정보 폴백 - 여러 서비스 시도
      try {
        // 첫 번째 IP 서비스 시도
        let ipLocation = await fetchLocationByIP();
        
        // IP 위치가 명확하지 않은 경우(기본값과 같은 경우) 다른 서비스 시도
        if (ipLocation.source === 'default') {
          try {
            // 다른 IP 위치 서비스 시도 (예: ipinfo.io 등)
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
            console.warn('대체 IP 위치 서비스 오류:', alternativeError);
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