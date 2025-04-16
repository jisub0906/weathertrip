import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import TopBanner from "../components/Banner/TopBanner";
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

  const router = useRouter();
  const keyword = router.query.keyword || "";

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

  const handleNearbyAttractionsLoad = (attractions) => {
    setNearbyAttractions(attractions || []);
    if (!isNearbyMode) {
      setFilteredAttractions(attractions || []);
    }
  };

  const handleAllAttractionsLoad = (attractions) => {
    setAllAttractions(attractions || []);
    if (!isNearbyMode) {
      setFilteredAttractions(attractions || []);
    }
  };

  const handleShowNearby = () => {
    if (mapRef.current?.moveToCurrentLocation) {
      mapRef.current.moveToCurrentLocation();
      setIsNearbyMode(true);
      setFilteredAttractions(nearbyAttractions);
    }
  };

  const handleShowAll = () => {
    setIsNearbyMode(false);
    setFilteredAttractions(allAttractions);
    if (mapRef.current?.fetchAllAttractions) {
      mapRef.current.fetchAllAttractions();
    }
  };

  const handleAttractionClick = (attraction) => {
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
  };

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredAttractions(isNearbyMode ? nearbyAttractions : allAttractions);
      return;
    }

    const places = new window.kakao.maps.services.Places();

    places.keywordSearch(searchTerm, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const match = data[0];
        const lat = parseFloat(match.y);
        const lng = parseFloat(match.x);

        if (mapRef.current?.moveToCoords) {
          mapRef.current.moveToCoords(lat, lng);
        }

        if (mapRef.current?.addSearchMarker) {
          mapRef.current.addSearchMarker(lat, lng);
        }

        const searchData = isNearbyMode ? nearbyAttractions : allAttractions;
        const results = searchData.filter(
          (item) =>
            (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.address || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredAttractions(results);
      } else {
        const searchData = isNearbyMode ? nearbyAttractions : allAttractions;
        const results = searchData.filter(
          (item) =>
            (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.address || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredAttractions(results);
      }
    });
  };

  return (
    <>
      <Head>
        <title>지도로 관광지 찾기 | 날씨 관광 앱</title>
        <meta name="description" content="현재 위치 주변의 관광지를 지도에서 찾아보세요." />
      </Head>

      <TopBanner />
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
                onClick={() => handleAttractionClick(attraction)}
              >
                <h3>{attraction.name || attraction.title || "이름 없음"}</h3>
                <div className={styles.attractionDetails}>
                  <span>{attraction.address || attraction.location || "주소 정보 없음"}</span>
                  <span>
                    {attraction.distance
                      ? `${(attraction.distance / 1000).toFixed(1)}km`
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
          />
        )}
      </main>
      <Footer />
    </>
  );
}
