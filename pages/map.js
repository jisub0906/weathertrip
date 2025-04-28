import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../components/Layout/Header";
import KakaoMap from "../components/Map/KakaoMap";
import SearchBar from "../components/Search/SearchBar";
import useLocation from "../hooks/useLocation";
import styles from "../styles/KakaoMap.module.css";

export default function Map() {
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

  // ✅ 자동 포커싱 로직 (로컬스토리지 기반)
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
            console.log('✅ 자동 포커싱 실행:', matched.name);
            handleAttractionClick(matched);
          } else {
            console.warn('❌ 해당 관광지를 찾을 수 없습니다');
          }

          localStorage.removeItem('searchKeyword');
          localStorage.removeItem('selectedAttractionId');
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkReady);
        console.log('⏱️ 지도와 관광지 로드 타임아웃');
      }, 10000);
    }
  }, [allAttractions]);

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
        console.error("키워드 기반 관광지 검색 실패:", err);
      }
    };

    fetchKeywordLocation();
  }, [keyword]);

  const handleNearbyAttractionsLoad = useCallback((attractions) => {
    setNearbyAttractions(attractions || []);
    if (!isNearbyMode) {
      setFilteredAttractions(attractions || []);
    }
  }, [isNearbyMode]);

  const handleAllAttractionsLoad = useCallback((attractions) => {
    setAllAttractions(attractions || []);
    if (!isNearbyMode) {
      setFilteredAttractions(attractions || []);
    }
  }, [isNearbyMode]);

  const handleShowNearby = useCallback(() => {
    if (mapRef.current?.moveToCurrentLocation) {
      mapRef.current.moveToCurrentLocation();
      setIsNearbyMode(true);
    }
  }, []);

  const handleShowAll = useCallback(() => {
    setIsNearbyMode(false);
    if (mapRef.current?.fetchAllAttractions) {
      mapRef.current.fetchAllAttractions();
    }
  }, []);

  useEffect(() => {
    setFilteredAttractions(isNearbyMode ? nearbyAttractions : allAttractions);
  }, [isNearbyMode, nearbyAttractions, allAttractions]);

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

  const handleAttractionClick = useCallback((attraction) => {
    setSelectedAttraction(attraction);
    if (mapRef.current?.handleAttractionClick) {
      mapRef.current.handleAttractionClick(attraction);
    }
    if (mapRef.current?.moveToCoords) {
      const lat = attraction.location?.coordinates?.[1] || attraction["위도(도)"];
      const lng = attraction.location?.coordinates?.[0] || attraction["경도(도)"];
      if (lat && lng) {
        console.log("📍 moveToCoords 실행!", lat, lng);
        mapRef.current.moveToCoords(lat, lng);
        mapRef.current.addSearchMarker(lat, lng);
      }
    }
    if (isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSearch = (keyword, attractionId) => {
    console.log('검색 실행:', keyword, attractionId);
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
    console.log('검색 결과:', filtered);
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

      <Header />

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
