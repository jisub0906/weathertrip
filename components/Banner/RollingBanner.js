import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/RollingBanner.module.css';

/**
 * 랜덤 관광지 이미지를 롤링 배너로 보여주는 컴포넌트
 * @returns 롤링 배너 UI
 */
export default function RollingBanner() {
  // 현재 보여지는 슬라이드 인덱스
  const [current, setCurrent] = useState(0);
  // 슬라이드 데이터 배열
  const [slides, setSlides] = useState([]);
  // 현재 이미지 로딩 완료 여부
  const [imageLoaded, setImageLoaded] = useState(false);
  // 에러 상태
  const [error, setError] = useState(false);
  // 프리로드된 이미지 URL 저장용 ref
  const preloadedImagesRef = useRef(new Map());
  // 자동 롤링용 interval ref
  const intervalRef = useRef(null);
  // 수동 조작 후 롤링 재시작 타이머 ref
  const resumeTimeoutRef = useRef(null);

  /**
   * 단일 이미지 프리로드 함수
   * @param url - 프리로드할 이미지 URL
   * @returns 프리로드 완료된 이미지 URL
   */
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

  /**
   * 여러 이미지 프리로드 함수 (fetch 후 바로 로딩)
   * @param slidesData - 슬라이드 데이터 배열
   */
  const preloadImages = useCallback(async (slidesData) => {
    try {
      if (slidesData.length > 0) {
        setImageLoaded(true); // fetch 후 바로 true
        const promises = slidesData.map(slide => preloadImage(slide.image));
        await Promise.all(promises);
      }
    } catch (error) {
      // 프리로드 실패 시 무시
    }
  }, [preloadImage]);

  // 초기 데이터(랜덤 관광지) 로드 및 이미지 프리로드
  useEffect(() => {
    /**
     * 랜덤 관광지 API에서 데이터 fetch 및 슬라이드 데이터 가공
     */
    const fetchFreshData = async () => {
      try {
        setError(false);
        setImageLoaded(false);
        const response = await fetch('/api/attractions/random?limit=5');
        const data = await response.json();
        if (data.attractions && data.attractions.length > 0) {
          const attractionsData = data.attractions.map(attraction => ({
            id: attraction._id || attraction.id,
            title: attraction.name,
            image: attraction.image, // API 구조 변경 반영
            address: attraction.address
          }));
          await preloadImages(attractionsData);
          setSlides(attractionsData);
        } else {
          setError(true);
        }
      } catch (error) {
        setError(true);
      }
    };
    fetchFreshData();
    // cleanup: 롤링 타이머/재시작 타이머 정리
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [preloadImages]);

  /**
   * 자동 롤링 타이머 시작
   */
  const startRolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(current => (current + 1) % slides.length);
    }, 5000);
  }, [slides.length]);

  /**
   * 자동 롤링 타이머 정지
   */
  const stopRolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // 자동 롤링 타이머 관리
  useEffect(() => {
    if (!imageLoaded || slides.length === 0) return;
    startRolling();
    return () => stopRolling();
  }, [startRolling, stopRolling, imageLoaded, slides.length]);

  /**
   * 수동 조작 시 롤링 일시 정지 후 5초 뒤 재시작
   */
  const handleManualNav = (navFn) => {
    stopRolling();
    navFn();
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      startRolling();
    }, 5000);
  };

  /**
   * 다음 슬라이드로 이동
   */
  const nextSlide = useCallback(() => {
    if (!imageLoaded || slides.length === 0) return;
    setCurrent(current => (current + 1) % slides.length);
  }, [slides.length, imageLoaded]);

  /**
   * 이전 슬라이드로 이동
   */
  const prevSlide = useCallback(() => {
    if (!imageLoaded || slides.length === 0) return;
    setCurrent(current => (current - 1 + slides.length) % slides.length);
  }, [slides.length, imageLoaded]);

  // 데이터가 없을 때 스켈레톤 UI
  if (error) {
    return (
      <div className={styles.banner}>
        <div className={styles.errorMsg}>관광지 이미지를 불러오지 못했습니다.</div>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }
  if (slides.length === 0) {
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
        <Image
          src={slides[current].image}
          alt={slides[current].title}
          fill
          priority
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL="/placeholder.png"
          style={{
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            visibility: imageLoaded ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out'
          }}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      {slides[current] && imageLoaded && (
        <div className={styles.overlay}>
          <h2>{slides[current].title}</h2>
          <p className={styles.address}>{slides[current].address}</p>
        </div>
      )}
      {!imageLoaded && (
        <div className={styles.imageLoading}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
      <button className={styles.prev} aria-label="이전 슬라이드" onClick={() => handleManualNav(prevSlide)}>
        &lt;
      </button>
      <button className={styles.next} aria-label="다음 슬라이드" onClick={() => handleManualNav(nextSlide)}>
        &gt;
      </button>
    </div>
  );
}