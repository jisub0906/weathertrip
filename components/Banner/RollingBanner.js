import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/RollingBanner.module.css';

const DEFAULT_SLIDES = [
  {
    id: 1,
    title: '여행지 추천',
    description: '날씨에 맞는 여행지를 추천해드립니다',
    image: 'https://i.ibb.co/svhf5fW4/0-1.webp',
    link: '/recommend'
  },
  {
    id: 2,
    title: '커뮤니티',
    description: '다른 여행자들의 이야기를 들어보세요',
    image: 'https://i.ibb.co/nsmpsr1y/0-1.jpg',
    link: '/community'
  },
  {
    id: 3,
    title: '지도',
    description: '주변 관광지를 찾아보세요',
    image: 'https://i.ibb.co/jZzSKH6L/N-0-0.png',
    link: '/map'
  }
];

export default function RollingBanner() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
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
      // 첫 번째 이미지 먼저 로드
      await preloadImage(slidesData[0].image);
      setImageLoaded(true);

      // 나머지 이미지들 병렬로 로드
      const promises = slidesData.slice(1).map(slide => preloadImage(slide.image));
      await Promise.all(promises);
    } catch (error) {
      console.error('이미지 프리로드 실패:', error);
    }
  }, [preloadImage]);

  const preloadNextImage = useCallback(() => {
    const nextIndex = (current + 1) % slides.length;
    const nextImage = slides[nextIndex]?.image;
    if (nextImage && !preloadedImagesRef.current.has(nextImage)) {
      preloadImage(nextImage);
    }
  }, [current, slides, preloadImage]);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const response = await fetch('/api/attractions/popular');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const attractionsData = data.data.map(attraction => ({
            id: attraction._id,
            title: attraction.name,
            description: attraction.description,
            image: attraction.images[0],
            link: `/attractions/${attraction._id}`
          }));
          
          await preloadImages(attractionsData);
          setSlides(attractionsData);
        } else {
          await preloadImages(DEFAULT_SLIDES);
        }
      } catch (error) {
        console.error('인기 관광지 데이터 로드 실패:', error);
        await preloadImages(DEFAULT_SLIDES);
      }
    };

    fetchFreshData();
  }, [preloadImages]);

  // 다음 슬라이드로 이동
  const nextSlide = useCallback(() => {
    if (!imageLoaded) return;
    
    const nextSlide = (current + 1) % slides.length;
    if (preloadedImagesRef.current.has(slides[nextSlide].image)) {
      setCurrent(nextSlide);
    } else {
      preloadImage(slides[nextSlide].image).then(() => {
        setCurrent(nextSlide);
      });
    }
  }, [current, slides, imageLoaded, preloadImage]);

  // 이전 슬라이드로 이동
  const prevSlide = useCallback(() => {
    if (!imageLoaded) return;
    
    const prevSlide = (current - 1 + slides.length) % slides.length;
    if (preloadedImagesRef.current.has(slides[prevSlide].image)) {
      setCurrent(prevSlide);
    } else {
      preloadImage(slides[prevSlide].image).then(() => {
        setCurrent(prevSlide);
      });
    }
  }, [current, slides, imageLoaded, preloadImage]);

  // 자동 슬라이드
  useEffect(() => {
    if (!imageLoaded) return;
    
    intervalRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextSlide, imageLoaded]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  if (slides.length === 0 || !imageLoaded) {
    return (
      <div className={styles.banner}>
        <div className={styles.skeletonImage}></div>
      </div>
    );
  }

  const displayedSlide = current;
  const nextSlideIndex = (current + 1) % slides.length;
  const prevSlideIndex = (current - 1 + slides.length) % slides.length;

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
          onLoad={handleImageLoad}
        />
      </div>
      
      {slides[displayedSlide] && imageLoaded && (
        <div className={styles.content}>
          <h2>{slides[displayedSlide].title}</h2>
          <p>{slides[displayedSlide].description}</p>
          <a href={slides[displayedSlide].link}>자세히 보기</a>
        </div>
      )}
      
      {!imageLoaded && (
        <div className={styles.imageLoading}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
      
      <button className={styles.prevButton} onClick={prevSlide}>
        &lt;
      </button>
      <button className={styles.nextButton} onClick={nextSlide}>
        &gt;
      </button>
    </div>
  );
}