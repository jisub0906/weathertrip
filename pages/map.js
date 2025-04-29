import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../components/Layout/Header";
import KakaoMap from "../components/Map/KakaoMap";
import SearchBar from "../components/Search/SearchBar";
import useLocation from "../hooks/useLocation";
import styles from "../styles/KakaoMap.module.css";

/**
 * 지도 기반 관광지 탐색 페이지 컴포넌트
 * - 카카오맵, 관광지 검색/선택, 내 주변/전체 관광지, 반응형 사이드바 등 제공
 * @returns JSX.Element - 지도 페이지 UI
 */
export default function Map() {
  // 위치 정보, 관광지 목록, 선택/검색 상태 등 주요 상태 변수
  const { location, error: locationError, loading: locationLoading } = useLocation();
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [allAttractions, setAllAttractions] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const mapRef = useRef(null);
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const keyword = router.query.keyword || "";

  /**
   * 로컬스토리지 기반 자동 포커싱 로직
   * - 검색어/관광지ID가 저장되어 있으면 해당 관광지로 자동 포커스
   */
  useEffect(() => {
    const savedKeyword = localStorage.getItem('searchKeyword');
    const savedAttractionId = localStorage.getItem('selectedAttractionId');
    if (savedKeyword && savedAttractionId) {
      setSearchKeyword(savedKeyword);
      const checkReady = setInterval(() => {
        if (mapRef.current?.mapReady && allAttractions.length > 0) {
          clearInterval(checkReady);
          const matched = allAttractions.find((a) => a._id?.toString?.() === savedAttractionId);
          if (matched) {
            handleAttractionClick(matched);
          }
          localStorage.removeItem('searchKeyword');
          localStorage.removeItem('selectedAttractionId');
        }
      }, 500);
      setTimeout(() => {
        clearInterval(checkReady);
      }, 10000);
    }
  }, [allAttractions]);

  /**
   * 쿼리스트링(keyword) 기반 관광지 검색 및 지도 이동
   */
  useEffect(() => {
    if (!keyword) return;
    const fetchKeywordLocation = async () => {
      try {
        const res = await fetch(`/api/attractions/search?name=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        if (data?.attraction) {
          const lat = data.attraction["위도(도)"] || data.attraction.location?.coordinates?.[1];
          const lng = data.attraction["경도(도)"] || data.attraction.location?.coordinates?.[0];
          if (mapRef.current?.moveToCoords) {
            mapRef.current.moveToCoords(lat, lng);
          }
          if (mapRef.current?.addSearchMarker) {
            mapRef.current.addSearchMarker(lat, lng);
          }
          setSelectedAttraction(data.attraction);
        }
      } catch (err) {
        // 키워드 기반 관광지 검색 실패 시 무시
      }
    };
    fetchKeywordLocation();
  }, [keyword]);

  /**
   * 내 주변 관광지 데이터 로드 콜백
   * @param attractions - 관광지 배열
   */
  const handleNearbyAttractionsLoad = useCallback((attractions) => {
    setNearbyAttractions(attractions || []);
    if (!isNearbyMode) {
      setFilteredAttractions(attractions || []);
    }
  }, [isNearbyMode]);

  /**
   * 전체 관광지 데이터 로드 콜백
   * @param attractions - 관광지 배열
   */
  const handleAllAttractionsLoad = useCallback((attractions) => {
    setAllAttractions(attractions || []);
    if (!isNearbyMode) {
      setFilteredAttractions(attractions || []);
    }
  }, [isNearbyMode]);

  /**
   * 내 주변 관광지 모드 전환 및 지도 이동
   */
  const handleShowNearby = useCallback(() => {
    if (mapRef.current?.moveToCurrentLocation) {
      mapRef.current.moveToCurrentLocation();
      setIsNearbyMode(true);
    }
  }, []);

  /**
   * 전체 관광지 모드 전환 및 전체 데이터 로드
   */
  const handleShowAll = useCallback(() => {
    setIsNearbyMode(false);
    if (mapRef.current?.fetchAllAttractions) {
      mapRef.current.fetchAllAttractions();
    }
  }, []);

  // 모드 전환 시 필터링된 관광지 목록 갱신
  useEffect(() => {
    setFilteredAttractions(isNearbyMode ? nearbyAttractions : allAttractions);
  }, [isNearbyMode, nearbyAttractions, allAttractions]);

  // 반응형(모바일) 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  /**
   * 관광지 클릭 시 상세 정보 및 지도 이동
   * @param attraction - 관광지 객체
   */
  const handleAttractionClick = useCallback((attraction) => {
    setSelectedAttraction(attraction);
    if (mapRef.current?.handleAttractionClick) {
      mapRef.current.handleAttractionClick(attraction);
    }
    if (mapRef.current?.moveToCoords) {
      const lat = attraction.location?.coordinates?.[1] || attraction["위도(도)"];
      const lng = attraction.location?.coordinates?.[0] || attraction["경도(도)"];
      if (lat && lng) {
        mapRef.current.moveToCoords(lat, lng);
        mapRef.current.addSearchMarker(lat, lng);
      }
    }
    if (isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  /**
   * 사이드바 닫기 핸들러
   */
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  /**
   * 관광지 검색 핸들러
   * @param keyword - 검색어
   * @param attractionId - 특정 관광지 ID(선택적)
   */
  const handleSearch = (keyword, attractionId) => {
    if (!keyword) {
      setFilteredAttractions(isNearbyMode ? nearbyAttractions : allAttractions);
      return;
    }
    setSearchKeyword(keyword);
    const searchData = isNearbyMode ? nearbyAttractions : allAttractions;
    const filtered = searchData.filter(attraction =>
      (attraction._id === attractionId) ||
      ((attraction.name || '').toLowerCase().includes(keyword.toLowerCase()) && !attractionId)
    );
    setFilteredAttractions(filtered);
    if (filtered.length > 0 && mapRef.current) {
      const firstAttraction = filtered[0];
      const lat = firstAttraction.location?.coordinates?.[1] || firstAttraction.latitude;
      const lng = firstAttraction.location?.coordinates?.[0] || firstAttraction.longitude;
      if (lat && lng) {
        mapRef.current.moveToCoords(lat, lng);
        mapRef.current.addSearchMarker(lat, lng);
      }
    }
  };

  return (
    <>
      <Head>
        <title>지도로 관광지 찾기 | 날씨 관광 앱</title>
        <meta name="description" content="현재 위치 주변의 관광지를 지도에서 찾아보세요." />
      </Head>
      <Header>
        <aside className={`${styles.attractionsSidebar} ${isMobile && !sidebarOpen ? styles.closed : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>관광지</h2>
            <div className={styles.buttonGroup}>
              <button className={`${styles.modeButton} ${!isNearbyMode ? styles.active : ''}`} onClick={handleShowAll}>전체 관광지</button>
              <button className={`${styles.modeButton} ${isNearbyMode ? styles.active : ''}`} onClick={handleShowNearby}>내 주변 관광지</button>
            </div>
            {isMobile && (
              <button className={styles.closeBtn} onClick={handleCloseSidebar} aria-label="닫기">×</button>
            )}
          </div>
          <div className={styles.searchBarContainer}>
            {!isNearbyMode && <SearchBar onSearch={handleSearch} />}
          </div>
          {filteredAttractions.length === 0 ? (
            <div className={styles.emptyMessage}>
              <p>관광지가 로드되지 않았습니다.</p>
              <p>지도를 움직여 관광지를 찾아보세요.</p>
            </div>
          ) : (
            <div className={styles.attractionsList}>
              {filteredAttractions.map((attraction, index) => (
                <div
                  key={attraction._id || index}
                  className={`${styles.attractionItem} ${selectedAttraction === attraction ? styles.selected : ""}`}
                  data-attraction-id={attraction._id}
                  onClick={() => handleAttractionClick(attraction)}
                >
                  <h3>{attraction.name || "이름 없음"}</h3>
                  <div className={styles.attractionDetails}>
                    <span className={styles.address}>{attraction.address || "주소 정보 없음"}</span>
                    {attraction.distance && (
                      <span className={styles.distance}>
                        {attraction.distance.toFixed(1)}km
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
        {/* 모바일에서 sidebar가 닫혀있을 때만 floating 열기 버튼 */}
        {isMobile && !sidebarOpen && (
          <button
            style={{
              position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 200, background: '#3498db', color: '#fff', borderRadius: '50%', width: 48, height: 48, fontSize: 28, border: 'none'
            }}
            onClick={() => {
              setSidebarOpen(true);
              setSelectedAttraction(null);
              if (mapRef.current?.closeDetail) {
                mapRef.current.closeDetail();
              }
            }}
            aria-label="관광지 목록 열기"
          >📍</button>
        )}
      </Header>
      <main className={styles.mapArea}>
        {locationLoading && (
          <div className={styles.mapLoadingOverlay}>
            <div className={styles.mapLoadingSpinner} />
            <p>위치 정보를 불러오는 중...</p>
          </div>
        )}
        {locationError && (
          <div className={styles.mapLoadingOverlay}>
            <p>위치 정보를 불러오는데 문제가 발생했습니다.</p>
            <p>{locationError}</p>
          </div>
        )}
        {!locationLoading && (
          <KakaoMap
            ref={mapRef}
            center={location || { latitude: 37.5665, longitude: 126.978 }}
            onMarkerClick={handleAttractionClick}
            onNearbyAttractionsLoad={handleNearbyAttractionsLoad}
            onAllAttractionsLoad={handleAllAttractionsLoad}
            onCloseDetail={() => {
              setSelectedAttraction(null);
              setSidebarOpen(true);
            }}
            isNearbyMode={isNearbyMode}
            initialKeyword={keyword || searchKeyword}
            onListClose={() => setSidebarOpen(false)}
          />
        )}
      </main>
    </>
  );
}
