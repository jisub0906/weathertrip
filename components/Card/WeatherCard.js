import React from 'react';
import styles from '../../styles/WeatherCard.module.css';

/**
 * 현재 날씨 정보를 카드 형태로 보여주는 컴포넌트
 * @param weather - 날씨 정보 객체 (condition, temperature, sky, humidity, precipitation, windSpeed, recommendedType 등)
 * @returns 날씨 정보 카드 UI
 */
export default function WeatherCard({ weather }) { 
  // 날씨 정보가 없으면 아무것도 렌더링하지 않음
  if (!weather) return null;

  /**
   * 날씨 상태에 따라 이모지 아이콘 반환
   * @param condition - 날씨 상태 문자열
   * @returns 날씨 이모지
   */
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Clear':
        return '☀️';
      case 'Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Snow':
        return '❄️';
      default:
        return '🌤️';
    }
  };

  /**
   * 추천 타입에 따라 안내 문구 반환
   * @param type - 추천 타입 (indoor, outdoor, both)
   * @returns 추천 문구
   */
  const getRecommendationType = (type) => {
    switch (type) {
      case 'indoor':
        return '실내 관광지 추천';
      case 'outdoor':
        return '야외 관광지 추천';
      case 'both':
        return '실내/야외 모두 추천';
      default:
        return '';
    }
  };

  return (
    <div className={styles.weatherCard}>
      <div className={styles.iconSection}>
        {/* 날씨 상태에 따른 이모지 아이콘 */}
        <span className={styles.weatherIcon}>{getWeatherIcon(weather.condition)}</span>
      </div>
      <div className={styles.infoSection}>
        {/* 현재 기온 */}
        <div className={styles.temperature}>{weather.temperature.toFixed(1)}°C</div>
        {/* 하늘 상태(맑음, 흐림 등) */}
        <div className={styles.condition}>{weather.sky}</div>
        {/* 상세 정보: 습도, 강수, 풍속 */}
        <div className={styles.details}>
          <span>습도: {weather.humidity}%</span>
          <span>강수: {weather.precipitation}</span>
          <span>풍속: {weather.windSpeed}m/s</span>
        </div>
        {/* 추천 관광지 타입 안내 */}
        <div className={styles.recommendation}>
          {getRecommendationType(weather.recommendedType)}
        </div>
      </div>
    </div>
  );
} 