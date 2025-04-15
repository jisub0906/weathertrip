import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/RollingBanner.module.css';

// 몽고DB에서 가져온 데이터터를 사용하여 슬라이드 배열 생성
const slides = [
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
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    const keyword = slides[current].name;
    router.push(`/map?keyword=${encodeURIComponent(keyword)}`);
  };

  const goPrev = () => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  };
  
  const goNext = () => {
    setCurrent(prev => (prev + 1) % slides.length);
  };

  return (
    <div className={styles.banner}>
      <img src={slides[current].image} alt={slides[current].name} onClick={handleClick} />
      <div className={styles.overlay}>
        <h2>{slides[current].name}</h2>
      </div>
      <button className={styles.prev} onClick={goPrev}>&#10094;</button>
      <button className={styles.next} onClick={goNext}>&#10095;</button>
    </div>
  );
}
