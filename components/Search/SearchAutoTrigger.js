// components/Search/SearchAutoTrigger.js
import { useEffect } from 'react';

export default function SearchAutoTrigger({ mapRef, onSearch, keyword }) {
  // useEffect 훅을 사용하여 keyword가 변경될 때마다 자동으로 검색을 트리거합니다.
  useEffect(() => {
    if (!keyword || !mapRef?.current || typeof onSearch !== 'function') return; // keyword가 없거나 mapRef가 없거나 onSearch가 함수가 아닐 경우 실행하지 않음
    
    const waitForMapAndSearch = async () => {
      const checkReady = () =>
        mapRef.current && // mapRef가 존재하는지 확인
        mapRef.current.mapInstance && // 지도 인스턴스 확인
        mapRef.current.mapReady; // 지도 인스턴스와 준비 상태 확인

      let retries = 20; // 최대 20회 시도 (0.1초 마다 -> 약 2초 대기)
      // 0.1초 간격으로 지도와 관광지 로드 상태를 확인합니다.
      // 지도와 관광지가 모두 로드되면 검색을 실행합니다.
      const interval = setInterval(() => {
        if (checkReady()) {
          clearInterval(interval);
          onSearch(keyword);
        } else { // 0이 되면 중단하고 경고 메시지 출력
          retries--;
          if (retries <= 0) { 
            clearInterval(interval);
            console.warn('🕓 지도 로딩 시간 초과로 자동 검색 실패');
          }
        }
      }, 100);
    };

    waitForMapAndSearch();
  }, [keyword, mapRef, onSearch]);

  return null;
}  