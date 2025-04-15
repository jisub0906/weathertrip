import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/WeatherBanner.module.css';
import useLocation from '@/hooks/useLocation';
import axios from 'axios';

export default function WeatherBanner() {
  const [weather, setWeather] = useState(null);
  const router = useRouter();
  const { location, loading: locationLoading, error: locationError } = useLocation();

  useEffect(() => {
    if (!location || locationLoading.latitude || !locationLoading.longitude) return null; // 위치 정보가 없거나 로딩 중이면 종료
    
    const fetchWeather = async () => {
        try {
          const response = await axios.get('/api/weather', {
            params: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          });
          if (response.data?.success) {
            setWeather(response.data.data); // ✅ 여기에 .data 꼭 추가!
          }
        } catch (error) {
          console.error('날씨 불러오기 실패:', error);
        }
      };
    
      fetchWeather();
    }, [location]);

  const getBannerMessage = (temp, condition) => {
    if (condition.includes('Rain') || condition.includes('Snow')) {
      return { emoji: '🌧️', text: '오늘 같은 날엔 실내에서 즐길 수 있는 여행지가 딱이에요!' };
    } else if (temp <= 11) {
      return { emoji: '🥶', text: '쌀쌀한 날씨엔 실내에서 여유롭게 즐기는 여행지를 추천드려요.' };
    } else if (condition.includes('Clouds')) {
      return { emoji: '🌥️', text: '흐린 날엔 가벼운 바람을 맞으며 야외 여행지를 둘러보는 것도 좋겠어요!' };
    } else if (temp >= 27) {
      return { emoji: '🔥', text: '무더운 날씨엔 시원한 실내 명소에서 힐링 여행 어떠세요?' };
    } else {
      return { emoji: '🌤️', text: '오늘 같은 맑고 적당한 날엔 야외 여행지로 떠나보세요! 기분 전환에 딱이에요.' };
    }
  };

  if (!weather) return null;

  const { temperature, condition } = weather;
  const { emoji, text } = getBannerMessage(temperature, condition);

  return (
    <div className={styles.weatherBanner}>
      <div className={styles.weatherIcon}>{emoji}</div>
      <div className={styles.textContent}>
        <h3>{text}</h3>
        <p className={styles.cta} onClick={() => router.push('/recommend')}>
          👉 가장 가까운 여행지가 궁금하다면, 지금 확인해보세요!
        </p>
      </div>
    </div>
  );
}
