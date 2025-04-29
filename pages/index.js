import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import TopBanner from '../components/Banner/TopBanner';
import KoreaMap from '../components/Map/KoreaMap';
import RollingBanner from '../components/Banner/RollingBanner';
import WeatherBanner from '../components/Banner/WeatherBanner';
import useLocation from '../hooks/useLocation';
import axios from 'axios';
import styles from '../styles/Home.module.css';
import Image from 'next/image';
import { calculateAttractionsDistance } from '../utils/distance';

/**
 * 지역별 위경도 좌표 상수
 * - 관광지 API 요청 시 지역 중심 좌표로 활용
 */
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

/**
 * 관광지 목록 섹션 컴포넌트
 * - 관광지 목록, 거리 계산, 목록 열기/닫기 등 UI 제공
 * @param loading - 관광지 데이터 로딩 여부
 * @param error - 에러 메시지
 * @param attractions - 관광지 배열
 * @param isOpen - 목록 열림 여부
 * @param onOpenChange - 목록 열기/닫기 핸들러
 * @param userLocation - 사용자 위치
 * @param onCardClic - 관광지 카드 클릭 핸들러
 * @returns JSX.Element
 */
const AttractionListSection = ({ 
  loading, 
  error, 
  attractions,
  isOpen,
  onOpenChange,
  userLocation,
  onCardClic 
}) => {
  // 관광지와 사용자 위치 간 거리 계산
  const attractionsWithDistance = calculateAttractionsDistance(attractions, userLocation);

  return (
    <div className={`${styles.attractionListSection} ${isOpen ? styles.open : ''}`}>
      <div className={styles.listHeader}>
        <h2>관광지 목록</h2>
        <button 
          className={styles.closeButton}
          onClick={() => onOpenChange(false)}
          aria-label="관광지 목록 닫기"
        >
          ×
        </button>
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

      {!loading && !error && attractionsWithDistance.length > 0 && (
        <div className={styles.attractionsList}>
          {attractionsWithDistance.map((attraction, index) => (
            <div 
            key={attraction._id || index} 
            className={styles.locationCard}
            onClick={() => onCardClic(attraction)}
            >
              <div className={styles.locationInfo}>
                <h4 className={styles.locationName}>{attraction.name}</h4>
                <p className={styles.locationAddress}>
                  <span className={styles.icon}>📍</span>
                  {attraction.address}
                </p>
                {attraction.distance && (
                  <span className={styles.distance}>
                    <span className={styles.icon}>🚗</span>
                    {attraction.distance.toFixed(1)}km
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 메인 페이지(Home)
 * - 지역별 관광지, 인기 여행지, 날씨, 지도, 배너 등 다양한 정보 제공
 * @returns JSX.Element - 홈 UI
 */
export default function Home() {
  const { location: userLocation } = useLocation();
  // activeRegion: 현재 선택된 지역
  const [activeRegion, setActiveRegion] = useState('seoul');
  // attractions: 현재 지역의 관광지 목록
  const [attractions, setAttractions] = useState([]);
  // loading: 관광지 데이터 로딩 상태
  const [loading, setLoading] = useState(false);
  // error: 관광지 데이터 에러 메시지
  const [error, setError] = useState(null);
  // popularAttractions: 인기 여행지 목록
  const [popularAttractions, setPopularAttractions] = useState([]);
  // popularLoading: 인기 여행지 로딩 상태
  const [popularLoading, setPopularLoading] = useState(false);
  // isListOpen: 관광지 목록 패널 열림 여부
  const [isListOpen, setIsListOpen] = useState(false);
  // attractionReviews: 인기 여행지별 최근 리뷰 맵
  const [attractionReviews, setAttractionReviews] = useState({});

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
   * 지역별 관광지 데이터 비동기 로드
   * @param region - 선택된 지역 코드
   */
  const fetchAttractions = useCallback(async (region) => {
    setLoading(true);
    setError(null);
    try {
      const coords = REGION_COORDINATES[region] || REGION_COORDINATES.all;
      const response = await axios.get('/api/attractions/attractions', {
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
      setError('관광지 정보를 불러오는데 실패했습니다.');
      setAttractions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 지역 선택 시 상태 및 관광지 데이터 갱신
   * @param region - 선택된 지역 코드
   */
  const handleRegionSelect = useCallback((region) => {
    setActiveRegion(region);
    setIsListOpen(true);
    fetchAttractions(region);
  }, [fetchAttractions]);

  // 최초 렌더링 시 서울 지역 관광지 로드
  useEffect(() => {
    fetchAttractions('seoul');
  }, [fetchAttractions]);

  /**
   * 특정 관광지의 최근 리뷰 5개를 가져오는 함수
   * @param attractionId - 관광지 ObjectId
   * @returns string - HTML로 조합된 리뷰 텍스트
   */
  const fetchAttractionReviews = async (attractionId) => {
    try {
      const response = await fetch(`/api/attractions/${attractionId}/review`);
      const data = await response.json();
      const latestReviews = data.reviews.slice(0, 5)
        .map(review => `"${review.content}"`)
        .join('<br /><br />');
      return latestReviews || '';
    } catch (error) {
      return '';
    }
  };

  // 인기 여행지 및 각 여행지별 최근 리뷰 로드
  useEffect(() => {
    const fetchPopularAttractions = async () => {
      setPopularLoading(true);
      try {
        const response = await axios.get('/api/attractions/popular');
        if (response.data.success && response.data.data.attractions) {
          const attractions = response.data.data.attractions;
          setPopularAttractions(attractions);
          const reviewsPromises = attractions.map(attraction => 
            fetchAttractionReviews(attraction._id)
          );
          const reviews = await Promise.all(reviewsPromises);
          const reviewsMap = attractions.reduce((acc, attraction, index) => {
            acc[attraction._id] = reviews[index];
            return acc;
          }, {});
          setAttractionReviews(reviewsMap);
        } else {
          setPopularAttractions([]);
        }
      } catch (error) {
        setPopularAttractions([]);
      } finally {
        setPopularLoading(false);
      }
    };
    fetchPopularAttractions();
  }, []);

  return (
    <>
      <Head>
        <title>weather trip</title>
        <meta name="description" content="대한민국의 다양한 관광지를 찾아보세요." />
      </Head>
      <TopBanner />
      <Header />
      <main className={styles.main}>
        <RollingBanner />
        <WeatherBanner />
        <KoreaMap selectedRegion={activeRegion} onRegionSelect={handleRegionSelect} />
        <AttractionListSection
          loading={loading}
          error={error}
          attractions={attractions}
          isOpen={isListOpen}
          onOpenChange={setIsListOpen}
          userLocation={userLocation}
          onCardClic={handleCardClick}
        />
      </main>
      <section className={styles.popularSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>인기 여행지</h2>
          {popularLoading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : popularAttractions.length === 0 ? (
            <div className={styles.noAttractions}>
              아직 인기 여행지가 없습니다. 여행지에 좋아요를 눌러주세요!
            </div>
          ) : (
            <div className={styles.popularGrid}>
              {popularAttractions.slice(0, 10).map((attraction, index) => (
                <div key={attraction._id} 
                className={styles.popularCard} 
                onClick={() => handleCardClick(attraction)}
                >
                  <div className={styles.rankBadge}>#{index + 1}</div>
                  <div className={styles.imageContainer}>
                    {Array.isArray(attraction.images) && attraction.images.length > 0 ? (
                      <Image
                        src={attraction.images[0]}
                        alt={attraction.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        priority={index < 2}
                      />
                    ) : (
                      <div className={styles.noImage}>이미지 없음</div>
                    )}
                  </div>
                  <h3>{attraction.name}</h3>
                  <div className={styles.likeCount}>
                    ❤️ {attraction.likeCount || 0}
                  </div>
                  <div className={styles.address}>{attraction.address}</div>
                  <div className={styles.description} 
                    dangerouslySetInnerHTML={{ __html: attractionReviews[attraction._id] || '아직 리뷰가 없습니다.' }}>
                  </div>
                  <div className={styles.tags}>
                    {attraction.테마명 && (
                      <span className={`${styles.tag} ${styles.theme}`}>
                        🎯 {attraction.테마명}
                      </span>
                    )}
                    {attraction.실내구분 && (
                      <span className={`${styles.tag} ${styles.indoor}`}>
                        {attraction.실내구분 === '실내' ? '🏠 실내' : '🌳 실외'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}