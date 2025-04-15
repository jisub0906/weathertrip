import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout/Layout';
import KoreaMap from '../components/Map/KoreaMap';
import useLocation from '../hooks/useLocation';
import Link from 'next/link';
import axios from 'axios';
import styles from '../styles/Home.module.css';
import RollingBanner from '../Banner/RollingBanner';

// 컴포넌트 외부로 이동
const REGION_COORDINATES = {
  'seoul': { latitude: 37.5665, longitude: 126.9780 },
  'busan': { latitude: 35.1796, longitude: 129.0756 },
  'daegu': { latitude: 35.8714, longitude: 128.6014 },
  'incheon': { latitude: 37.4563, longitude: 126.7052 },
  'gwangju': { latitude: 35.1595, longitude: 126.8526 },
  'daejeon': { latitude: 36.3504, longitude: 127.3845 },
  'ulsan': { latitude: 35.5384, longitude: 129.3114 },
  'sejong': { latitude: 36.4800, longitude: 127.2890 },
  'gyeonggi': { latitude: 37.4138, longitude: 127.5183 },
  'gangwon': { latitude: 37.8228, longitude: 128.1555 },
  'chungbuk': { latitude: 36.8000, longitude: 127.7000 },
  'chungnam': { latitude: 36.5184, longitude: 126.8000 },
  'jeonbuk': { latitude: 35.8200, longitude: 127.1500 },
  'jeonnam': { latitude: 34.8160, longitude: 126.4630 },
  'gyeongbuk': { latitude: 36.4919, longitude: 128.8889 },
  'gyeongnam': { latitude: 35.4606, longitude: 128.2132 },
  'jeju': { latitude: 33.4996, longitude: 126.5312 },
  'all': { latitude: 36.5, longitude: 127.8 }
};

export default function Home() {
  const { location } = useLocation();
  const [activeRegion, setActiveRegion] = useState('seoul');
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const attractionsPerPage = 8;

  const fetchAttractions = useCallback(async (region) => {
    setLoading(true);
    setError(null);
    try {
      const coords = REGION_COORDINATES[region] || REGION_COORDINATES.all;
      const response = await axios.get('/api/attractions', {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: region === 'all' ? 300 : 100,
          limit: 100
        }
      });

      if (response.data && response.data.attractions) {
        setAttractions(response.data.attractions);
      } else {
        setAttractions([]);
      }
    } catch (err) {
      console.error('관광지 데이터 로딩 오류:', err);
      setError('관광지 정보를 불러오는데 실패했습니다.');
      setAttractions([]);
    } finally {
      setLoading(false);
    }
  }, []); // 종속성 제거

  const handleRegionSelect = useCallback((region) => {
    setActiveRegion(region);
    setCurrentPage(1);
    fetchAttractions(region);
  }, [fetchAttractions]);

  // 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    fetchAttractions('seoul');
  }, [fetchAttractions]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({
      top: document.querySelector(`.${styles.attractionsGrid}`).offsetTop - 100,
      behavior: 'smooth'
    });
  };

  const indexOfLastAttraction = currentPage * attractionsPerPage;
  const indexOfFirstAttraction = indexOfLastAttraction - attractionsPerPage;
  const currentAttractions = attractions.slice(indexOfFirstAttraction, indexOfLastAttraction);
  const totalPages = Math.ceil(attractions.length / attractionsPerPage);

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage, endPage;

    if (totalPages <= maxVisibleButtons) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxVisibleButtons / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxVisibleButtons / 2) - 1;

      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxVisibleButtons;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxVisibleButtons + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`${styles.paginationButton} ${currentPage === i ? styles.activePage : ''}`}
          onClick={() => handlePageChange(i)}>
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <Layout>
      <Head>
        <title>관광지 추천 서비스</title>
        <meta name="description" content="대한민국의 다양한 관광지를 찾아보세요." />
      </Head>
      <section className={`${styles.hero} ${styles.greenHero}`}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>대한민국의<br />추천 관광지를 찾아보세요</h1>
            <p className={styles.heroSubtitle}>지역별 인기 관광지와 숨겨진 명소를 발견하세요.</p>
            <div className={styles.heroCta}>
              <Link href="/recommend" className="btn">맞춤 추천 받기</Link>
              <Link href="/map" className="btn btn-outline">지도로 보기</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 className={styles.sectionTitle}>대한민국 관광지 둘러보기</h2>
          <div className={styles.koreaMapContainer}>
            <KoreaMap
              onRegionSelect={handleRegionSelect}
              selectedRegion={activeRegion}
            />
          </div>

          {loading && (
            <div className={styles.loading}>
              <p>관광지 정보를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && attractions.length > 0 && (
            <div className={styles.resultsInfo}>
              <h3>
                {activeRegion === 'all' ? '전국' :
                  activeRegion === 'seoul' ? '서울' :
                    activeRegion === 'busan' ? '부산' :
                      activeRegion === 'daegu' ? '대구' :
                        activeRegion === 'incheon' ? '인천' :
                          activeRegion === 'gwangju' ? '광주' :
                            activeRegion === 'daejeon' ? '대전' :
                              activeRegion === 'ulsan' ? '울산' :
                                activeRegion === 'sejong' ? '세종' :
                                  activeRegion === 'gyeonggi' ? '경기도' :
                                    activeRegion === 'gangwon' ? '강원도' :
                                      activeRegion === 'chungbuk' ? '충청북도' :
                                        activeRegion === 'chungnam' ? '충청남도' :
                                          activeRegion === 'jeonbuk' ? '전라북도' :
                                            activeRegion === 'jeonnam' ? '전라남도' :
                                              activeRegion === 'gyeongbuk' ? '경상북도' :
                                                activeRegion === 'gyeongnam' ? '경상남도' :
                                                  activeRegion === 'jeju' ? '제주도' : '선택 지역'}의
                관광지 ({attractions.length}개)
              </h3>
              <p>페이지 {currentPage} / {totalPages}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className={styles.attractionsGrid}>
                {currentAttractions.length > 0 ? (
                  currentAttractions.map((attraction, index) => (
                    <div key={attraction._id || index} className={styles.attractionCard}>
                      <h3>{attraction.name}</h3>
                      <p>{attraction.description || attraction.address || '설명 없음'}</p>
                      {attraction.distanceKm && (
                        <p className={styles.distance}>거리: {attraction.distanceKm.toFixed(1)}km</p>
                      )}
                      {attraction.type && (
                        <p className={styles.type}>
                          유형: {attraction.type === 'indoor' ? '실내' :
                            attraction.type === 'outdoor' ? '야외' : '실내/야외'}
                        </p>
                      )}
                      {attraction.tags && (
                        <div className={styles.tags}>
                          {Array.isArray(attraction.tags)
                            ? attraction.tags.map((tag, i) => (
                              <span key={i} className={styles.tag}>{tag}</span>
                            ))
                            : typeof attraction.tags === 'string'
                              ? attraction.tags.split(',').map((tag, i) => (
                                <span key={i} className={styles.tag}>{tag.trim()}</span>
                              ))
                              : null
                          }
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.noAttractions}>선택한 지역의 관광지 정보가 없습니다.</p>
                )}
              </div>

              {attractions.length > attractionsPerPage && (
                <div className={styles.pagination}>
                  {/* 처음 버튼 */}
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    처음
                  </button>

                  {/* 이전 버튼 */}
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>

                  {/* 숫자 버튼들 */}
                  {renderPaginationButtons()}

                  {/* 다음 버튼 */}
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </button>

                  {/* 마지막 버튼 */}
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    마지막
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}