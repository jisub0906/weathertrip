import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/RollingBanner.module.css';

export default function RollingBanner() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const preloadedImagesRef = useRef(new Map());
  const intervalRef = useRef(null);

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

  const preloadImages = useCallback(async (slidesData) => {
    try {
      if (slidesData.length > 0) {
        await preloadImage(slidesData[0].image);
        setImageLoaded(true);

        const promises = slidesData.slice(1).map(slide => preloadImage(slide.image));
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('이미지 프리로드 실패:', error);
    }
  }, [preloadImage]);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const response = await fetch('/api/attractions/random?limit=5');
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (data.attractions && data.attractions.length > 0) {
          const attractionsData = data.attractions.map(attraction => ({
            id: attraction._id,
            title: attraction.name,
            image: attraction.images[0],
            address: attraction.address
          }));
          console.log('매핑된 데이터:', attractionsData);
          
          await preloadImages(attractionsData);
          setSlides(attractionsData);
        }
      } catch (error) {
        console.error('관광지 데이터 로드 실패:', error);
      }
    };

    fetchFreshData();
  }, [preloadImages]);

  const nextSlide = useCallback(() => {
    if (!imageLoaded || slides.length === 0) return;
    setCurrent(current => (current + 1) % slides.length);
  }, [slides.length, imageLoaded]);

  const prevSlide = useCallback(() => {
    if (!imageLoaded || slides.length === 0) return;
    setCurrent(current => (current - 1 + slides.length) % slides.length);
  }, [slides.length, imageLoaded]);

  useEffect(() => {
    if (!imageLoaded || slides.length === 0) return;
    
    intervalRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextSlide, imageLoaded, slides]);

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
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      
      <button className={styles.prev} onClick={prevSlide}>
        &lt;
      </button>
      <button className={styles.next} onClick={nextSlide}>
        &gt;
      </button>
    </div>
  );
}