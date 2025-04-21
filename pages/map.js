import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import KakaoMap from "../components/Map/KakaoMap";
import SearchBar from "../components/Search/SearchBar";
import useLocation from "../hooks/useLocation";
import styles from "../styles/KakaoMap.module.css";

export default function Map() {
  const {
    location,
    error: locationError,
    loading: locationLoading,
  } = useLocation();
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [allAttractions, setAllAttractions] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const mapRef = useRef(null);
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const router = useRouter();
  const keyword = router.query.keyword || "";

  // localStorage에서 저장된 키워드 불러오기
  useEffect(() => {
    const savedKeyword = localStorage.getItem('searchKeyword');
    const savedAttractionId = localStorage.getItem('selectedAttractionId');
    console.log('저장된 검색 키워드:', savedKeyword);
    console.log('저장된 관광지 ID:', savedAttractionId);
    
    if (savedKeyword && savedAttractionId) {
      setSearchKeyword(savedKeyword);
      
      // 지도와 관광지가 로드될 때까지 대기
      const checkMapAndAttractionsReady = setInterval(() => {
        if (mapRef.current?.mapReady && allAttractions.length > 0) {
          clearInterval(checkMapAndAttractionsReady);
          console.log('지도와 관광지 로드 완료, 검색 실행');
          handleSearch(savedKeyword, savedAttractionId);
          
          // 검색 완료 후 약간의 시간을 두고 카드 클릭
          setTimeout(() => {
            // 관광지 ID에 해당하는 카드 찾기
            const attractionCard = document.querySelector(`[data-attraction-id="${savedAttractionId}"]`);
            if (attractionCard) {
              console.log('관광지 카드 찾음, 클릭 실행');
              attractionCard.click();
            } else {
              console.log('관광지 카드를 찾을 수 없음');
            }
          }, 1000); // 카드가 렌더링될 시간을 고려해 1초 정도 대기
          
          localStorage.removeItem('searchKeyword');
          localStorage.removeItem('selectedAttractionId');
        }
      }, 500);
      
      setTimeout(() => {
        clearInterval(checkMapAndAttractionsReady);
        console.log('지도와 관광지 로드 타임아웃');
      }, 10000);
    }
  }, [allAttractions]);

  // 키워드 기반 위치 검색
  useEffect(() => {
    if (!keyword) return;

    const fetchKeywordLocation = async () => {
      try {
        const res = await fetch(
          `/api/attractions/search?name=${encodeURIComponent(keyword)}`
        );
        const data = await res.json();

        if (data && data.attraction) {
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
      }
    }

    if (window.innerWidth <= 768) {
      setShowSidebar(true);
    }
  }, []);

  const handleSearch = (keyword, attractionId) => {
    console.log('검색 실행:', keyword, attractionId);
    if (!keyword) {
      setFilteredAttractions(isNearbyMode ? nearbyAttractions : allAttractions);
      return;
    }
    
    setSearchKeyword(keyword);
    const searchData = isNearbyMode ? nearbyAttractions : allAttractions;
    const filtered = searchData.filter(attraction => 
      (attraction._id === attractionId) || // ID가 일치하는 경우
      ((attraction.name || '').toLowerCase().includes(keyword.toLowerCase()) &&
       !attractionId) // ID가 없고 이름만 일치하는 경우
    );
    console.log('검색 결과:', filtered);
    setFilteredAttractions(filtered);
    
    if (filtered.length > 0 && mapRef.current) {
      const firstAttraction = filtered[0];
      console.log('지도 이동:', firstAttraction);
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
      
      <aside className={styles.attractionsSidebar}>
        <div className={styles.sidebarHeader}>
          <h2>관광지</h2>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.modeButton} ${!isNearbyMode ? styles.active : ''}`}
              onClick={handleShowAll}
            >
              전체 관광지
            </button>
            <button
              className={`${styles.modeButton} ${isNearbyMode ? styles.active : ''}`}
              onClick={handleShowNearby}
            >
              내 주변 관광지
            </button>
          </div>
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
                    className={`${styles.attractionItem} ${
                      selectedAttraction === attraction ? styles.selected : ""
                    }`}
                    data-attraction-id={attraction._id}
                    onClick={() => handleAttractionClick(attraction)}
                  >
                <h3>{attraction.name || attraction.title || "이름 없음"}</h3>
                <div className={styles.attractionDetails}>
                  <span className={styles.address}>
                    <i className="fas fa-map-marker-alt"></i>
                    {attraction.address || attraction.location || "주소 정보 없음"}
                  </span>
                  <span className={styles.distance}>
                    <i className="fas fa-route"></i>
                    {attraction.distanceKm
                      ? `${attraction.distanceKm.toFixed(1)}km`
                      : attraction.distance
                      ? `${attraction.distance.toFixed(1)}km`
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

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
              setShowSidebar(true);
            }}
            isNearbyMode={isNearbyMode}
            initialKeyword={keyword || searchKeyword}
          />
        )}
      </main>     
    </>
  );
}