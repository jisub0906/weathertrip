import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/WeatherBanner.module.css';
import useLocation from '@/hooks/useLocation';
import axios from 'axios';

/**
 * 현재 위치 기반 날씨 정보를 바탕으로 여행지 추천 메시지를 보여주는 배너 컴포넌트
 * @returns 날씨 추천 배너 UI
 */
export default function WeatherBanner() {
  // 날씨 정보 상태
  const [weather, setWeather] = useState(null);
  // 라우터 인스턴스
  const router = useRouter();
  // 위치 정보 커스텀 훅 (위도, 경도, 로딩, 에러)
  const { location, loading, error } = useLocation();

  useEffect(() => {
    // 위치 정보가 없거나 로딩 중이면 날씨 요청하지 않음
    if (!location || loading) return;
    let cancelled = false;

    /**
     * 현재 위치 기준 날씨 정보를 서버에서 받아오는 비동기 함수
     */
    const fetchWeather = async () => {
      try {
        const response = await axios.get('/api/weather/weather', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });
        // 컴포넌트 언마운트 시 setState 방지
        if (!cancelled && response.data?.success) {
          setWeather(response.data.data);
        }
      } catch (error) {
        // 날씨 API 호출 실패 시 무시
      }
    };

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [location, loading]);

  /**
   * 온도/날씨 조건에 따라 추천 메시지와 이모지 반환
   * @param temp - 현재 기온
   * @param condition - 날씨 상태 문자열
   * @returns 추천 메시지(이모지+JSX)
   */
  const getBannerMessage = (temp, condition) => {
    if (condition.includes('Rain') || condition.includes('Snow')) {
      return {
        emoji: '🌧️',
        jsx: (
          <>
            오늘 같은 날엔 <span className={styles.indoor}>실내에서 즐길 수 있는 여행지</span>가 딱이에요!
          </>
        ),
      };
    } else if (temp <= 11) {
      return {
        emoji: '🥶',
        jsx: (
          <>
            쌀쌀한 날씨엔 <span className={styles.indoor}>실내에서 여유롭게 즐기는 여행지</span>를 추천드려요.
          </>
        ),
      };
    } else if (condition.includes('Clouds')) {
      return {
        emoji: '🌥️',
        jsx: (
          <>
            흐린 날엔 가벼운 바람을 맞으며 <span className={styles.outdoor}>야외 여행지</span>를 둘러보는 것도 좋겠어요!
          </>
        ),
      };
    } else if (temp >= 27) {
      return {
        emoji: '🔥',
        jsx: (
          <>
            무더운 날씨엔 시원한 <span className={styles.indoor}>실내 명소</span>에서 힐링 여행 어떠세요?
          </>
        ),
      };
    } else {
      return {
        emoji: '🌤️',
        jsx: (
          <>
            오늘 같이 적당한 날엔 <span className={styles.outdoor}>야외 여행지</span>로 떠나보세요! 기분 전환에 딱이에요!
          </>
        ),
      };
    }
  };

  // 날씨 정보가 없으면 아무것도 렌더링하지 않음
  if (!weather) return null;

  // 날씨 정보 구조 분해
  const { temperature, condition } = weather;
  // 추천 메시지 및 이모지 추출
  const { emoji, jsx } = getBannerMessage(temperature, condition);

  return (
    <div className={styles.weatherBanner} onClick={() => router.push('/recommend')}>
      <div className={styles.weatherIcon}>{emoji}</div>
      <div className={styles.textContent}>
        <h3>{jsx}</h3>
        <p className={styles.cta}>
          👉 가장 가까운 여행지가 궁금하다면, 지금 확인해보세요!
        </p>
      </div>
    </div>
  );
}
