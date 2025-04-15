import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/RollingBanner.module.css';

const slides = [
  { name: '에버랜드', image: '/images/everland.jpg' },
  { name: '홍룡폭포', image: '/images/waterfall.jpg' },
  { name: 'N서울타워', image: '/images/seoultower.jpg' }
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

  return (
    <div className={styles.banner} onClick={handleClick}>
      <img src={slides[current].image} alt={slides[current].name} />
      <div className={styles.overlay}>
        <h2>{slides[current].name}</h2>
      </div>
    </div>
  );
}
