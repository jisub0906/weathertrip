import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Header from '../components/Layout/Header';
import useLocation from '../hooks/useLocation';
import styles from '../styles/Recommend.module.css';
import axios from 'axios';
import SearchBar from '../components/Search/SearchBar';
import AIRecommendation from '../components/Ai/AIRecommendation';

/**
 * 맞춤형 관광지 추천 페이지 컴포넌트
 * - 위치/날씨 기반 관광지 추천, 필터, 무한 스크롤, AI 추천 등 제공
 * @returns JSX.Element - 추천 페이지 UI
 */
export default function Recommend() {
  // 위치, 날씨, 관광지, 필터, 페이지네이션 등 주요 상태 변수
  const { location, error: locationError, loading: locationLoading } = useLocation();
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [visibleAttractions, setVisibleAttractions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();
  const [searchTerm, setSearchTerm] = useState('');
  const lastAttractionElementRef = useRef();
  const [activeFilters, setActiveFilters] = useState({
    type: '전체',
    tag: '전체'
  });

  /**
   * 관광지 카드 클릭 시 상세 페이지로 이동
   * @param attraction - 관광지 객체
   */
  const handleCardClick = (attraction) => {
    if (!attraction?.name) return;
    localStorage.setItem('searchKeyword', attraction.name);
    localStorage.setItem('selectedAttractionId', attraction._id);
    window.location.href = '/map';
  };

  /**
   * 검색어 기반 관광지 필터링
   * @param term - 검색어
   */
  const applySearchFilter = useCallback((term) => {
    if (!term) {
      setFilteredAttractions(attractions);
      return;
    }
    const filtered = attractions.filter(item => 
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredAttractions(filtered);
  }, [attractions]);

  /**
   * 위치 정보 기반 날씨 정보 조회
   */
  useEffect(() => {
    if (!location) return;
    // Mock 데이터 - 날씨 API 실패 시 폴백
    const mockWeatherData = {
      temperature: 23,
      humidity: 65,
      windSpeed: 2.5,
      condition: "Clear",
      sky: "맑음"
    };
    async function fetchWeather() {
      try {
        setWeatherLoading(true);
        setWeatherError(null);
        const response = await axios.get('/api/weather/weather', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        });
        if (response.data.success) {
          setWeather(response.data.data);
        } else {
          throw new Error(response.data.message || '날씨 정보를 가져오는데 실패했습니다.');
        }
      } catch (err) {
        setWeatherError(err.message || '날씨 정보를 가져오는데 실패했습니다.');
        // API가 실패할 경우 Mock 데이터 사용
        setWeather(mockWeatherData);
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchWeather();
  }, [location]);

  /**
   * 위치/날씨 기반 관광지 정보 조회
   */
  useEffect(() => {
    if (!location || !weather?.condition) return;
    async function fetchAttractions() {
      try {
        const response = await axios.get('/api/attractions/attractions', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            weatherCondition: weather.condition,
            limit: 50
          }
        });
        if (response.data.attractions) {
          const modifiedAttractions = response.data.attractions.map(attraction => {
            // tags가 없으면 테마명/기본값으로 보완
            if (!attraction.tags || !Array.isArray(attraction.tags) || attraction.tags.length === 0) {
              if (attraction.테마명) {
                attraction.tags = [attraction.테마명];
              } else {
                attraction.tags = ['문화/예술'];
              }
            }
            // 실내/야외 타입 보완
            if (!attraction.type) {
              if (attraction.실내구분 === '실내') {
                attraction.type = 'indoor';
              } else if (attraction.실내구분 === '실외') {
                attraction.type = 'outdoor';
              }
            }
            return attraction;
          });
          setAttractions(modifiedAttractions);
          setFilteredAttractions(modifiedAttractions);
          setPage(1);
          setHasMore(true);
        }
      } catch (err) {
        // 관광지 데이터 오류 시 무시(별도 처리 불필요)
      }
    }
    fetchAttractions();
  }, [location, weather]);

  /**
   * 필터(실내/야외, 태그) 적용
   */
  useEffect(() => {
    if (!attractions.length) return;
    let filtered = [...attractions];
    // 실내/야외 필터 적용
    if (activeFilters.type !== '전체') {
      const typeMap = {
        '실내': 'indoor',
        '야외': 'outdoor'
      };
      const filterType = typeMap[activeFilters.type] || '';
      filtered = filtered.filter(item => {
        if (item.type) {
          return item.type === filterType;
        } else if (item.실내구분) {
          return (filterType === 'indoor' && item.실내구분 === '실내') || 
                 (filterType === 'outdoor' && item.실내구분 === '실외');
        }
        return false;
      });
    }
    // 태그 기반 대분류 필터 적용
    if (activeFilters.tag !== '전체') {
      filtered = filtered.filter(item => {
        if (Array.isArray(item.tags) && item.tags.includes(activeFilters.tag)) {
          return true;
        }
        if (item.테마명 === activeFilters.tag) {
          return true;
        }
        return false;
      });
    }
    setFilteredAttractions(filtered);
    setPage(1);
    setHasMore(true);
  }, [attractions, activeFilters]);

  /**
   * 페이지네이션(무한 스크롤) 적용
   */
  useEffect(() => {
    if (filteredAttractions.length === 0) return;
    const itemsPerPage = 10;
    const startIndex = 0;
    const endIndex = Math.min(page * itemsPerPage, filteredAttractions.length);
    setVisibleAttractions(filteredAttractions.slice(startIndex, endIndex));
    setHasMore(endIndex < filteredAttractions.length);
  }, [filteredAttractions, page]);

  /**
   * IntersectionObserver 기반 무한 스크롤 구현
   */
  useEffect(() => {
    if (!lastAttractionElementRef.current || !hasMore || loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setLoading(true);
        setTimeout(() => {
          setPage(prevPage => prevPage + 1);
          setLoading(false);
        }, 800);
      }
    }, {
      threshold: 0.5
    });
    observer.current.observe(lastAttractionElementRef.current);
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, loading, visibleAttractions]);

  /**
   * 검색어 변경 시 관광지 필터링
   */
  useEffect(() => {
    applySearchFilter(searchTerm);
  }, [searchTerm, applySearchFilter]);

  /**
   * 날씨 변경 시 필터 초기화
   */
  useEffect(() => {
    if (!weather?.condition) return;
    setActiveFilters({
      type: '전체',
      tag: '전체'
    });
  }, [weather]);

  // 대분류/카테고리 옵션
  const locationTypes = ['전체', '실내', '야외'];
  const categories = [
    '전체',
    '자연/힐링',
    '종교/역사/전통',
    '체험/학습/산업',
    '문화/예술',
    '캠핑/스포츠',
    '쇼핑/놀이'
  ];

  /**
   * 날씨 상태에 따른 아이콘 반환
   * @param condition - 날씨 상태
   * @returns string - 이모지
   */
  const getWeatherIcon = (condition) => {
    if (!condition) return '🌈';
    switch (condition) {
      case 'Clear':
        return '☀️';
      case 'Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Snow':
        return '❄️';
      default:
        return '🌈';
    }
  };

  /**
   * 날씨 상태에 따른 텍스트 반환
   * @param condition - 날씨 상태
   * @returns string
   */
  const getWeatherText = (condition) => {
    if (!condition) return '알 수 없음';
    switch (condition) {
      case 'Clear':
        return '맑음';
      case 'Clouds':
        return '흐림';
      case 'Rain':
        return '비';
      case 'Snow':
        return '눈';
      default:
        return '알 수 없음';
    }
  };

  /**
   * 날씨 상태에 따른 추천 타입 반환
   * @param condition - 날씨 상태
   * @returns string
   */
  const getRecommendation = (condition) => {
    if (!condition) return '다양한 활동';
    switch (condition) {
      case 'Clear':
        return '야외 관광지';
      case 'Clouds':
        return '문화시설';
      case 'Rain':
        return '실내 관광지';
      case 'Snow':
        return '온천/실내 휴양지';
      default:
        return '다양한 활동';
    }
  };

  /**
   * 필터 변경 핸들러
   * @param filterType - 'type' 또는 'tag'
   * @param value - 선택값
   */
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  /**
   * 날씨 상태에 따라 추천 타입 반환(실내/야외)
   * @param condition - 날씨 상태
   * @returns string
   */
  const getRecommendedType = (condition) => {
    switch (condition) {
      case 'Clear':
        return '야외';
      case 'Clouds':
        return Math.random() > 0.5 ? '실내' : '야외';
      case 'Rain':
      case 'Snow':
        return '실내';
      default:
        return '전체';
    }
  };

  return (
    <>
      <Head>
        <title>맞춤형 관광지 추천 - 날씨별 관광지 추천 서비스</title>
        <meta name="description" content="나에게 맞는 관광지를 추천받아보세요." />
      </Head>
      <Header />
      <section className="section">
        <div className="container">
          <h1 className={styles.pageTitle}>맞춤형 관광지 추천</h1>
          {/* 위치 정보 로딩/오류 상태 표시 */}
          {locationLoading && (
            <div className={styles.statusMessage}>
              <p>📍 위치 정보를 가져오는 중입니다...</p>
            </div>
          )}
          {locationError && (
            <div className={styles.errorMessage}>
              <p>❌ 위치 정보를 가져오는데 문제가 발생했습니다: {locationError}</p>
              <p>기본 위치(서울)를 기준으로 정보를 제공합니다.</p>
            </div>
          )}
          {/* 날씨 정보 로딩/오류 상태 표시 */}
          {weatherLoading && (
            <div className={styles.statusMessage}>
              <p>🌤️ 날씨 정보를 가져오는 중입니다...</p>
            </div>
          )}
          {weatherError && (
            <div className={styles.errorMessage}>
              <p>❌ 날씨 정보를 가져오는데 문제가 발생했습니다: {weatherError}</p>
              <p>기본 날씨 정보를 기준으로 추천합니다.</p>
            </div>
          )}
          {/* 날씨 카드 */}
          {weather && (
            <div className={styles.weatherCard}>
              <div className={`${styles.weatherIcon} ${styles[`weather${weather.condition}`]}`}>
                {getWeatherIcon(weather.condition)}
              </div>
              <div className={styles.weatherInfo}>
                <h3>오늘의 날씨: {getWeatherText(weather.condition)}</h3>
                <p className={styles.weatherDetails}>
                  현재 온도: {weather.temperature}°C | 습도: {weather.humidity}% | 풍속: {weather.windSpeed}m/s
                </p>
                <div className={styles.recommendationBadge}>
                  추천: {getRecommendation(weather.condition)}
                </div>
                {weather.isBackupData && (
                  <p className={styles.warningText}>* 백업 날씨 데이터를 사용 중입니다</p>
                )}
                <div className={styles.aiRecommendSection}>
                  <AIRecommendation weather={weather} activeFilters={activeFilters} />
                </div>
              </div>
            </div>
          )}
          {/* 필터 섹션 */}
          <div className={styles.filtersSection}>
            <h2>관광지 필터</h2>
            <div className={styles.filterGroup}>
              <h3>대분류</h3>
              <div className={styles.filterOptions}>
                {locationTypes.map(option => (
                  <div
                    key={option}
                    className={`${styles.filterOption} ${activeFilters.type === option ? styles.active : ''}`}
                    onClick={() => handleFilterChange('type', option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <h3>카테고리</h3>
              <div className={styles.filterOptions}>
                {categories.map(option => (
                  <div
                    key={option}
                    className={`${styles.filterOption} ${activeFilters.tag === option ? styles.active : ''}`}
                    onClick={() => handleFilterChange('tag', option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* 추천 관광지 목록 (인스타그램 스타일) */}
          <h2 className={styles.attractionsTitle}>추천 관광지</h2>
          {/* 0414 searchBar 관련 + 추천 관광지 목록에서서 한번 더 검색 */}
          <SearchBar onSearch={(term) => {
            setSearchTerm(term); // 상태 저장
            applySearchFilter(term); // 필터링 실행
          }} />
          {filteredAttractions.length === 0 ? (
            <div className={styles.noResults}>
              <p>선택한 조건에 맞는 관광지가 없습니다.</p>
              <p>다른 조건으로 검색해보세요.</p>
            </div>
          ) : (
            <div className={styles.instagramFeed}>
              {visibleAttractions.map((attraction, index) => {
                // 마지막 요소에 ref 연결
                const isLastElement = index === visibleAttractions.length - 1;
                return (
                  <div
                    key={attraction._id || index}
                    className={styles.instagramPost}
                    ref={isLastElement ? lastAttractionElementRef : null}
                    onClick={() => handleCardClick(attraction)}
                  >
                    <div className={styles.postHeader}>
                      <div className={styles.postUser}>
                        <div className={styles.userName}>{attraction.name}</div>
                      </div>
                    </div>
                    <div className={styles.postImage}>
                    <Image 
                      src={attraction.images?.[0] || '/images/logo.png'} 
                      alt={attraction.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      priority={index === 0}
                    />
                    </div>
                    <div className={styles.postContent}>
                      <div className={styles.postCaption}>
                        <strong>{attraction.name}</strong>
                      </div>
                      <div className={styles.postMeta}>
                        <div className={styles.distance}>
                          <span>📍 거리: {attraction.distanceKm?.toFixed(1) || '0'}km</span>
                        </div>
                        <div className={styles.type}>
                          <span>🏢 {attraction.type === 'indoor' ? '실내' : attraction.type === 'outdoor' ? '야외' : '실내/야외'}</span>
                        </div>
                      </div>
                      <div className={styles.postTags}>
                        {attraction.tags && Array.isArray(attraction.tags) && attraction.tags.length > 0 ? (
                          attraction.tags.map(tag => (
                            <span 
                              key={tag} 
                              className={styles.tag}
                              data-category={tag}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          attraction.테마명 ? (
                            <span 
                              className={styles.tag}
                              data-category={attraction.테마명}
                            >
                              {attraction.테마명}
                            </span>
                          ) : (
                            <span 
                              className={styles.tag}
                              data-category="문화/예술"
                            >
                              문화/예술
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className={styles.loadingMore}>
                  더 많은 관광지 불러오는 중...
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}