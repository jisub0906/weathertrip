// components/Search/SearchAutoTrigger.js
import { useEffect } from 'react';

/**
 * 검색 자동 트리거 컴포넌트
 * @param mapRef - 지도 ref 객체 (mapInstance, mapReady 등 포함)
 * @param onSearch - 검색 실행 함수
 * @param keyword - 검색어
 * @returns 렌더링 없음 (side effect만 발생)
 */
export default function SearchAutoTrigger({ mapRef, onSearch, keyword }) {
  /**
   * [목적] keyword가 변경될 때마다, 지도와 관광지 데이터가 준비되면 자동으로 검색을 실행합니다.
   * [의도] 지도/관광지 비동기 로딩 환경에서 UX 개선 (자동 검색)
   */
  useEffect(() => {
    if (!keyword || !mapRef?.current || typeof onSearch !== 'function') return;
    /**
     * [목적] 지도와 관광지 데이터가 모두 준비될 때까지 polling 후 검색 실행
     * [의도] 비동기 로딩 환경에서 race condition 방지
     */
    const waitForMapAndSearch = async () => {
      // 지도 준비 상태를 확인하는 함수
      const checkReady = () =>
        mapRef.current &&
        mapRef.current.mapInstance &&
        mapRef.current.mapReady;

      let retries = 20; // 최대 20회(2초)까지 polling
      // 0.1초 간격으로 지도와 관광지 로드 상태를 확인
      const interval = setInterval(() => {
        if (checkReady()) {
          clearInterval(interval);
          onSearch(keyword);
        } else {
          retries--;
          if (retries <= 0) {
            clearInterval(interval);
            // 지도 로딩 실패 시 별도 경고/로깅 없이 종료
          }
        }
      }, 100);
    };
    waitForMapAndSearch();
  }, [keyword, mapRef, onSearch]);

  return null;
}  