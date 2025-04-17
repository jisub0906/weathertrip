import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import axios from 'axios';
import styles from '../../styles/RollingBanner.module.css';

// 로컬 스토리지 키 설정
const STORAGE_KEY = 'attractionsData';
const STORAGE_TIMESTAMP = 'attractionsTimestamp';
// 캐시 만료 시간 (24시간)
const CACHE_DURATION = 24 * 60 * 60 * 1000;
// 슬라이드 전환 간격 (밀리초) - 여기서 값을 조정하세요
const SLIDE_INTERVAL = 6000; // 6초로 변경 (원하는 시간으로 조정 가능)

// 기본 데이터
const DEFAULT_SLIDES = [
  {
    name: '광화문',
    image: 'https://i.ibb.co/svhf5fW4/0-1.webp',
    address: '서울 종로구 당주동 40'
  },
  {
    name: '조계사',
    image: 'https://i.ibb.co/nsmpsr1y/0-1.jpg',
    address: '서울 종로구 견지동 46'
  },
  {
    name: 'N서울타워',
    image: 'https://i.ibb.co/jZzSKH6L/N-0-0.png',
    address: '서울 용산구 용산동2가 1'
  }
];

export default function RollingBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const preloadedImagesRef = useRef({});
  const router = useRouter();

  // 캐시된 데이터 확인 함수
  const getCachedData = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP);
      
      if (data && timestamp) {
        // 캐시 만료 확인
        const now = new Date().getTime();
        if (now - parseInt(timestamp) < CACHE_DURATION) {
          return JSON.parse(data);
        }
      }
    } catch (error) {
      console.error('캐시 데이터 로드 실패:', error);
    }
    
    return null;
  };

  // 데이터를 캐시에 저장하는 함수
  const setCachedData = (data) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_TIMESTAMP, new Date().getTime().toString());
    } catch (error) {
      console.error('캐시 데이터 저장 실패:', error);
    }
  };

  // 이미지 프리로딩 함수
  const preloadImages = async (slidesData) => {
    if (!slidesData || slidesData.length === 0) return;
    
    // 첫 번째 이미지 로드 우선
    await preloadImage(slidesData[0].image);
    setImageLoaded(true);
    
    // 나머지 이미지 병렬 로드
    const promises = slidesData.slice(1).map(slide => preloadImage(slide.image));
    await Promise.allSettled(promises);
  };
  
  // 단일 이미지 프리로딩 - 네이티브 HTMLImageElement 사용
  const preloadImage = (url) => {
    return new Promise((resolve) => {
      if (preloadedImagesRef.current[url]) {
        resolve(url);
        return;
      }
      
      // 네이티브 HTMLImageElement 사용
      const img = new window.Image();
      img.onload = () => {
        preloadedImagesRef.current[url] = true;
        resolve(url);
      };
      img.onerror = () => {
        // 오류 발생해도 처리 계속
        resolve(url);
      };
      img.src = url;
    });
  };

  useEffect(() => {
    const fetchAttractions = async () => {
      // 캐시된 데이터 확인
      const cachedData = getCachedData();
      if (cachedData && cachedData.length > 0) {
        setSlides(cachedData);
        
        // 캐시된 데이터의 이미지 프리로딩
        await preloadImages(cachedData);
        setLoading(false);
        
        // 백그라운드에서 데이터 업데이트
        fetchFreshData();
        return;
      }
      
      // 기본 데이터로 초기화
      setSlides(DEFAULT_SLIDES);
      
      // 기본 데이터 이미지 프리로딩
      await preloadImages(DEFAULT_SLIDES);
      setLoading(false);
      
      // 캐시된 데이터가 없는 경우 API로 데이터 가져오기
      fetchFreshData();
    };

    const fetchFreshData = async () => {
      try {
        const response = await axios.get('/api/attractions', {
          params: {
            random: true,
            limit: 10
          }
        });

        if (response.data.attractions) {
          const attractionsData = response.data.attractions.map(attraction => ({
            name: attraction.name,
            image: attraction.images[0],
            address: attraction.address,
            description: attraction.description
          }));
          
          // 받아온 데이터의 이미지 프리로딩
          await preloadImages(attractionsData);
          
          // 데이터 설정
          setSlides(attractionsData);
          
          // 캐시에 저장
          setCachedData(attractionsData);
        }
      } catch (error) {
        console.error('인기 관광지 데이터 로딩 실패:', error);
        // 에러 시 기본 데이터 유지
      }
    };

    fetchAttractions();
  }, []);

  // 슬라이드 자동 전환 관리
  useEffect(() => {
    if (slides.length === 0) return;
    
    const timer = setInterval(() => {
      const nextSlide = (current + 1) % slides.length;
      
      // 다음 슬라이드 이미지 미리 로드
      preloadImage(slides[nextSlide].image).then(() => {
        setCurrent(nextSlide);
      });
    }, SLIDE_INTERVAL); // 변경된 슬라이드 간격 사용
    
    return () => clearInterval(timer);
  }, [slides.length, current]);

  // 슬라이드가 변경될 때 이미지 로드 상태 초기화
  useEffect(() => {
    if (slides.length === 0) return;
    
    setImageLoaded(false);
    // 현재 슬라이드 이미지가 이미 프리로드되어 있는지 확인
    if (preloadedImagesRef.current[slides[current]?.image]) {
      setImageLoaded(true);
    }
    
    // 현재 활성화 슬라이드 설정 (페이드 효과용)
    setTimeout(() => {
      setActiveSlide(current);
    }, 10);
  }, [current, slides]);

  const handleClick = () => {
    const keyword = slides[current]?.name;
    if (keyword) {
      router.push(`/map?keyword=${encodeURIComponent(keyword)}`);
    }
  };

  const goPrev = () => {
    const prevSlide = (current - 1 + slides.length) % slides.length;
    preloadImage(slides[prevSlide].image).then(() => {
      setCurrent(prevSlide);
    });
  };
  
  const goNext = () => {
    const nextSlide = (current + 1) % slides.length;
    preloadImage(slides[nextSlide].image).then(() => {
      setCurrent(nextSlide);
    });
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (loading && slides.length === 0) {
    return (
      <div className={styles.banner}>
        <div className={styles.skeletonLoader}>
          <div className={styles.skeletonImage}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.imageWrapper}>
        {/* 현재 이미지 */}
        {slides[current] && (
          <Image 
            src={slides[current].image} 
            alt={slides[current].name} 
            onClick={handleClick}
            width={1920}
            height={1080}
            priority
            onLoad={handleImageLoad}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              opacity: 1
            }}
          />
        )}
      </div>
      
      {/* 텍스트 오버레이 - 이미지가 로드된 후에만 표시 */}
      {imageLoaded && slides[current] && (
        <div className={`${styles.overlay} ${imageLoaded ? styles.visible : ''}`}>
          <h2>{slides[current].name}</h2>
          <p className={styles.address}>{slides[current].address}</p>
          {slides[current].description && (
            <p className={styles.description}>{slides[current].description}</p>
          )}
        </div>
      )}
      
      {/* 로딩 중 표시 */}
      {!imageLoaded && (
        <div className={styles.imageLoading}>
          <div className={styles.spinner}></div>
        </div>
      )}
      
      <button className={styles.prev} onClick={goPrev}>&#10094;</button>
      <button className={styles.next} onClick={goNext}>&#10095;</button>
    </div>
  );
}