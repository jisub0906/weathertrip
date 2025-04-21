import React from 'react';
import styles from '../../styles/WeatherCard.module.css';

// 날씨 컴포넌트
export default function WeatherCard({ weather }) { 
  if (!weather) return null; // 날씨 정보가 없으면 아무것도 렌더링하지 않음

  // 날씨 아이콘과 추천 타입을 결정하는 함수
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
  // 날씨 조건에 따라 추천되는 관광지 타입을을 결정하는 함수
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
        <span className={styles.weatherIcon}>{getWeatherIcon(weather.condition)}</span>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.temperature}>{weather.temperature.toFixed(1)}°C</div>
        <div className={styles.condition}>{weather.sky}</div>
        <div className={styles.details}>
          <span>습도: {weather.humidity}%</span>
          <span>강수: {weather.precipitation}</span>
          <span>풍속: {weather.windSpeed}m/s</span>
        </div>
        <div className={styles.recommendation}>
          {getRecommendationType(weather.recommendedType)}
        </div>
      </div>
    </div>
  );
} 