import React from 'react';
import styles from '../../styles/WeatherCard.module.css';

export default function WeatherCard({ weather }) {
  if (!weather) return null;

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