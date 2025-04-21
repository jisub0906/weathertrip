import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import axios from 'axios';
import styles from '../../styles/RollingBanner.module.css';

// 상수 정의
const STORAGE_KEY = 'attractionsData';
const STORAGE_TIMESTAMP = 'attractionsTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간
const SLIDE_INTERVAL = 5000; // 5초로 변경
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
  const [displayedSlide, setDisplayedSlide] = useState(0);
  const preloadedImagesRef = useRef(new Map());
  const timerRef = useRef(null);
  const router = useRouter();

  // 캐시된 데이터 확인
  const getCachedData = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP);
      
      if (data && timestamp) {
        const now = new Date().getTime();
        if (now - parseInt(timestamp) < CACHE_DURATION) {
          return JSON.parse(data);
        }
      }
    } catch (error) {
      console.error('캐시 데이터 로드 실패:', error);
    }
    return null;
  }, []);

  // 데이터 캐싱
  const setCachedData = useCallback((data) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_TIMESTAMP, new Date().getTime().toString());
    } catch (error) {
      console.error('캐시 데이터 저장 실패:', error);
    }
  }, []);

  // 이미지 프리로딩 최적화
  const preloadImage = useCallback((url) => {
    return new Promise((resolve) => {
      if (preloadedImagesRef.current.has(url)) {
        resolve(url);
        return;
      }
      
      const img = new window.Image();
      img.onload = () => {
        preloadedImagesRef.current.set(url, true);
        resolve(url);
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }, []);

  // 이미지 프리로딩 일괄 처리
  const preloadImages = useCallback(async (slidesData) => {
    if (!slidesData?.length) return;
    
    // 첫 번째 이미지 우선 로드
    await preloadImage(slidesData[0].image);
    setImageLoaded(true);
    
    // 나머지 이미지 병렬 로드
    const promises = slidesData.slice(1).map(slide => preloadImage(slide.image));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  // 다음 이미지 프리로딩
  const preloadNextImage = useCallback(() => {
    if (slides.length === 0) return;
    const nextIndex = (current + 1) % slides.length;
    const nextImage = slides[nextIndex]?.image;
    if (nextImage && !preloadedImagesRef.current.has(nextImage)) {
      preloadImage(nextImage);
    }
  }, [current, slides, preloadImage]);

  // API 데이터 가져오기
  const fetchFreshData = useCallback(async () => {
    try {
      const response = await axios.get('/api/attractions/random', {
        params: { random: true, limit: 10 },
        timeout: 5000
      });

      if (response.data.attractions) {
        const attractionsData = response.data.attractions.map(attraction => ({
          name: attraction.name,
          image: attraction.images[0],
          address: attraction.address,
          description: attraction.description
        }));
        
        await preloadImages(attractionsData);
        setSlides(attractionsData);
        setCachedData(attractionsData);
      }
    } catch (error) {
      console.error('인기 관광지 데이터 로딩 실패:', error);
    }
  }, [preloadImages, setCachedData]);

  // 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      const cachedData = getCachedData();
      
      if (cachedData?.length) {
        setSlides(cachedData);
        await preloadImages(cachedData);
        setLoading(false);
        if (cachedData.length > 1) {
          preloadImage(cachedData[1].image);
        }
        fetchFreshData();
      } else {
        setSlides(DEFAULT_SLIDES);
        await preloadImages(DEFAULT_SLIDES);
        setLoading(false);
        if (DEFAULT_SLIDES.length > 1) {
          preloadImage(DEFAULT_SLIDES[1].image);
        }
        fetchFreshData();
      }
    };

    initializeData();
  }, [getCachedData, preloadImages, preloadImage, fetchFreshData]);

  // 슬라이드 변경 시 다음 이미지 프리로드
  useEffect(() => {
    if (slides.length === 0) return;
    
    if (imageLoaded) {
      preloadNextImage();
    }
  }, [current, imageLoaded, slides.length, preloadNextImage]);

  // 슬라이드 자동 전환
  useEffect(() => {
    if (slides.length === 0 || !imageLoaded) return;
    
    let timeoutId;
    const startTimer = () => {
      timeoutId = setTimeout(() => {
        const nextSlide = (current + 1) % slides.length;
        if (preloadedImagesRef.current.has(slides[nextSlide].image)) {
          setCurrent(nextSlide);
        } else {
          // 다음 이미지가 로드되지 않은 경우, 로드 후 전환
          preloadImage(slides[nextSlide].image).then(() => {
            setCurrent(nextSlide);
          });
        }
      }, SLIDE_INTERVAL);
    };

    startTimer();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [slides.length, current, imageLoaded, preloadImage]);

  // 슬라이드 변경 시 이미지 로드 상태 관리
  useEffect(() => {
    if (slides.length === 0) return;
    
    setImageLoaded(false);
    if (preloadedImagesRef.current.has(slides[current]?.image)) {
      setImageLoaded(true);
      setDisplayedSlide(current);
    }
  }, [current, slides]);

  const goPrev = useCallback(() => {
    if (!imageLoaded) return; // 이미지가 로드되지 않은 경우 전환하지 않음
    
    const prevSlide = (current - 1 + slides.length) % slides.length;
    if (preloadedImagesRef.current.has(slides[prevSlide].image)) {
      setCurrent(prevSlide);
    } else {
      preloadImage(slides[prevSlide].image).then(() => {
        setCurrent(prevSlide);
      });
    }
  }, [current, slides.length, preloadImage, imageLoaded]);
  
  const goNext = useCallback(() => {
    if (!imageLoaded) return; // 이미지가 로드되지 않은 경우 전환하지 않음
    
    const nextSlide = (current + 1) % slides.length;
    if (preloadedImagesRef.current.has(slides[nextSlide].image)) {
      setCurrent(nextSlide);
    } else {
      preloadImage(slides[nextSlide].image).then(() => {
        setCurrent(nextSlide);
      });
    }
  }, [current, slides.length, preloadImage, imageLoaded]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setDisplayedSlide(current);
  }, [current]);

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
        {slides[current] && (
          <img 
            src={slides[current].image} 
            alt={slides[current].name} 
            onLoad={handleImageLoad}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
              visibility: imageLoaded ? 'visible' : 'hidden'
            }}
          />
        )}
      </div>
      
      {slides[displayedSlide] && imageLoaded && (
        <div 
          className={styles.overlay}
          style={{
            opacity: 1,
            transform: 'translateY(0)',
            transition: 'all 0.5s ease-in-out',
            visibility: 'visible'
          }}
        >
          <h2>{slides[displayedSlide].name}</h2>
          <p className={styles.address}>{slides[displayedSlide].address}</p>
        </div>
      )}
      
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