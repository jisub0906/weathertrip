import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../components/Layout/Layout";
import KakaoMap from "../components/Map/KakaoMap";
import SearchBar from "../components/Search/SearchBar";
import useLocation from "../hooks/useLocation";
import styles from "../styles/Map.module.css";
import { handleSearchKeyword } from "../utils/mapHelper";
import { fetchKeywordLocation } from "../utils/mapHelper";

export default function Map() {
  const {
    location,
    error: locationError,
    loading: locationLoading,
  } = useLocation();
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const mapRef = useRef(null);
  const [filteredAttractions, setFilteredAttractions] = useState([]); // 0414 searchBar 관련


  // rollingBanner 에서 검색어로 이동
  const router = useRouter();
  const keyword = router.query.keyword || "";

  // utils/mapHelper; -MH
  useEffect(() => {
    fetchKeywordLocation({ keyword, mapRef, setSelectedAttraction });
  }, [keyword]);

  // 주변 관광지 정보 업데이트 핸들러
  const handleNearbyAttractionsLoad = (attractions) => {
    setNearbyAttractions(attractions || []);
  };

  // 사이드바 열기
  const handleAttractionClick = (attraction) => {
    setSelectedAttraction(attraction);

    if (mapRef.current?.handleAttractionClick) {
      mapRef.current.handleAttractionClick(attraction);
    }
  };

  // 관광지 상세 정보 닫기 핸들러
  const handleCloseDetail = () => {
    setSelectedAttraction(null);
    setShowSidebar(false);
  };

  const handleSearch = (searchTerm) => {
    handleSearchKeyword({
      searchTerm,
      mapRef,
      nearbyAttractions,
      setFilteredAttractions,
    });
  };

  // 사이드바 렌더링 모바일 인지 아닌지 
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // 첫 실행
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Layout hideFooter={true}>
      <Head>
        <title>지도로 관광지 찾기 | 날씨 관광 앱</title>
        <meta
          name="description"
          content="현재 위치 주변의 관광지를 지도에서 찾아보세요."
        />
      </Head>

      <div className={styles.mapPageContainer}>
        {isMobile ? (
          // ✅ 모바일: 바텀시트
          <div className={`${styles.bottomSheet} ${showSidebar ? styles.open : ''}`}>
            <div className={styles.bottomSheetHeader}>
              <h2>주변 관광지</h2>
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className={styles.bottomSheetList}>
              {(filteredAttractions.length > 0 ? filteredAttractions : nearbyAttractions).map((attraction, index) => (
                <div
                  key={index}
                  className={`${styles.attractionItem} ${selectedAttraction === attraction ? styles.selected : ''}`}
                  onClick={() => handleAttractionClick(attraction)}
                >
                  <h3>{attraction.name || attraction.title || '이름 없음'}</h3>
                  <div className={styles.attractionDetails}>
                    <span>{attraction.address || attraction.location || '주소 정보 없음'}</span>
                    <span>
                      {attraction.distance ? `${(attraction.distance / 1000).toFixed(1)}km` : ''}
                    </span>
                  </div>
                  {attraction.tags && (
                    <div className={styles.tags}>
                      {(typeof attraction.tags === 'string' ? attraction.tags.split(',') : attraction.tags).map((tag, i) => (
                        <span key={i} className={styles.tag}>{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // 🖥 데스크탑: 사이드바
          <div
            id="attractions-sidebar"
            className={`${styles.attractionsSidebar} ${showSidebar ? styles.open : ''}`}
          >
            <div className={styles.sidebarHeader}>
              <h2>주변 관광지</h2>
            </div>
            <SearchBar onSearch={handleSearch} />
            {nearbyAttractions.length === 0 ? (
              <div className={styles.emptyMessage}>
                <p>주변 관광지가 로드되지 않았습니다.</p>
                <p>지도를 움직여 주변 관광지를 찾아보세요.</p>
              </div>
            ) : (
              <div className={styles.attractionsList}>
                {(filteredAttractions.length > 0 ? filteredAttractions : nearbyAttractions).map((attraction, index) => (
                  <div
                    key={index}
                    className={`${styles.attractionItem} ${selectedAttraction === attraction ? styles.selected : ''}`}
                    onClick={() => handleAttractionClick(attraction)}
                  >
                    <h3>{attraction.name || attraction.title || '이름 없음'}</h3>
                    <div className={styles.attractionDetails}>
                      <span>{attraction.address || attraction.location || '주소 정보 없음'}</span>
                      <span>
                        {attraction.distance ? `${(attraction.distance / 1000).toFixed(1)}km` : ''}
                      </span>
                    </div>
                    {attraction.tags && (
                      <div className={styles.tags}>
                        {(typeof attraction.tags === 'string' ? attraction.tags.split(',') : attraction.tags).map((tag, i) => (
                          <span key={i} className={styles.tag}>{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 지도 영역 */}
        <div className={styles.mapArea}>
          {locationLoading && (
            <div className={styles.mapLoading}>
              <p>위치 정보를 불러오는 중...</p>
            </div>
          )}
          {locationError && (
            <div className={styles.mapError}>
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
              onCloseDetail={() => {
                setSelectedAttraction(null);
                setShowSidebar(true);
              }}
            />
          )}
        </div>

        {/* 버튼 보이기 */}
        <button
          className={styles.toggleSidebarBtn}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? "목록 닫기" : "관광지 목록 보기"}
        </button>
      </div>
    </Layout>
  );
}