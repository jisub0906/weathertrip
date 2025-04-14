import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout/Layout';
import KakaoMap from '../components/Map/KakaoMap';
import SearchBar from '../components/Search/SearchBar'
import useLocation from '../hooks/useLocation';
import styles from '../styles/Map.module.css';

export default function Map() {
  const { location, error: locationError, loading: locationLoading } = useLocation();
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const mapRef = useRef(null);
  const [filteredAttractions, setFilteredAttractions] = useState([]); // 0414 searchBar 관련

  // 주변 관광지 정보 업데이트 핸들러
  const handleNearbyAttractionsLoad = (attractions) => {
    setNearbyAttractions(attractions || []);
  };

  // 마커 클릭 핸들러
  const handleAttractionClick = (attraction) => {
    setSelectedAttraction(attraction);

    // 지도 컴포넌트의 함수 호출하여 상세 정보 표시
    if (mapRef.current?.handleAttractionClick) {
      mapRef.current.handleAttractionClick(attraction);
    }

    // 모바일에서 사이드바 자동 열기
    if (window.innerWidth <= 768) {
      setShowSidebar(true);
    }
  };

  // 0414 searchBar 관련 - 검색어로 지도 이동 + 관광지 필터링
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredAttractions(nearbyAttractions); // 검색어 없으면 전체 표시
      return;
    }

    // 🔍 1. 카카오맵 장소 검색 API 사용
    const places = new window.kakao.maps.services.Places();

    places.keywordSearch(searchTerm, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const match = data[0];
        const lat = parseFloat(match.y);
        const lng = parseFloat(match.x);

        // 📍 2. 지도 중심 이동
        if (mapRef.current?.moveToCoords) {
          mapRef.current.moveToCoords(lat, lng);
        }

        // 📍 2-1. 검색 마커 추가
        if (mapRef.current?.addSearchMarker) {
          mapRef.current.addSearchMarker(lat, lng);
        }

        // 📋 3. 관광지 리스트 필터링
        const results = nearbyAttractions.filter(item =>
          (item.name || '').includes(searchTerm) ||
          (item.description || '').includes(searchTerm)
        );
        setFilteredAttractions(results);
      } else {
        alert('해당 장소를 찾을 수 없어요!');
      }
    });
  }
  return (
    <Layout>
      <Head>
        <title>지도로 관광지 찾기 | 날씨 관광 앱</title>
        <meta name="description" content="현재 위치 주변의 관광지를 지도에서 찾아보세요." />
      </Head>
      <div className={styles.mapPageContainer}>
        <div id="attractions-sidebar" className={`${styles.attractionsSidebar} ${showSidebar ? styles.open : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>주변 관광지</h2>
          </div>

          <SearchBar onSearch={handleSearch} />  {/* 서치바 */}

          {nearbyAttractions.length === 0 ? (
            <div className={styles.emptyMessage}>
              <p>주변 관광지가 로드되지 않았습니다.</p>
              <p>지도를 움직여 주변 관광지를 찾아보세요.</p>
            </div>
          ) : (
            <div className={styles.attractionsList}>
              {(filteredAttractions.length > 0 ? filteredAttractions : nearbyAttractions).map((attraction, index) => ( // 0414 searchBar관련 마커이동동
                <div
                  key={index}
                  className={`${styles.attractionItem} ${selectedAttraction === attraction ? styles.selected : ''}`}
                  onClick={() => handleAttractionClick(attraction)}
                >
                  <h3>{attraction.name || attraction.title || '이름 없음'}</h3>
                  <div className={styles.attractionDetails}>
                    <span>{attraction.address || attraction.location || '주소 정보 없음'}</span>
                    <span>{attraction.distance ? `${(attraction.distance / 1000).toFixed(1)}km` : ''}</span>
                  </div>
                  {attraction.tags && attraction.tags.length > 0 && (
                    <div className={styles.tags}>
                      {typeof attraction.tags === 'string'
                        ? attraction.tags.split(',').map((tag, i) => (
                          <span key={i} className={styles.tag}>{tag.trim()}</span>
                        ))
                        : attraction.tags.map((tag, i) => (
                          <span key={i} className={styles.tag}>{tag}</span>
                        ))
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
              center={location || { latitude: 37.5665, longitude: 126.9780 }}
              onMarkerClick={handleAttractionClick}
              onNearbyAttractionsLoad={handleNearbyAttractionsLoad}
            />
          )}
        </div>

        <button
          className={styles.toggleSidebarBtn}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? '사이드바 닫기' : '관광지 목록 보기'}
        </button>
      </div>
    </Layout>
  );
}