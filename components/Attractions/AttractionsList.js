import React from 'react';
import styles from '../../styles/AttractionsList.module.css';

export default function AttractionsList({ attractions, loading, error, weatherCondition, onAttractionClick }) {
  if (loading) {
    return <div className={styles.loading}>관광지 정보를 불러오는 중...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>오류: {error}</div>;
  }
  
  if (!attractions || attractions.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>주변에 추천할 관광지가 없습니다.</p>
        <p>검색 반경을 늘리거나 다른 위치에서 시도해보세요.</p>
      </div>
    );
  }
  
  // 날씨 조건에 따른 메시지
  const getWeatherMessage = () => {
    switch (weatherCondition) {
      case 'Clear':
        return '맑은 날씨에 방문하기 좋은 관광지';
      case 'Clouds':
        return '구름이 있는 날씨에 방문하기 좋은 관광지';
      case 'Rain':
        return '비 오는 날에도 즐길 수 있는 관광지';
      case 'Snow':
        return '눈 오는 날에도 즐길 수 있는 관광지';
      default:
        return '주변 인기 관광지';
    }
  };
  
  const handleAttractionClick = (attraction) => {
    if (onAttractionClick) {
      onAttractionClick(attraction);
    }
  };
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{getWeatherMessage()}</h2>
      
      <div className={styles.attractionsList}>
        {attractions.map((attraction) => (
          <div 
            key={attraction._id} 
            className={styles.attractionCard}
            onClick={() => handleAttractionClick(attraction)}
          >
            <div className={styles.imageContainer}>
              {attraction.images && attraction.images.length > 0 ? (
                <img 
                  src={attraction.images[0]} 
                  alt={attraction.name} 
                  className={styles.attractionImage}
                />
              ) : (
                <div className={styles.noImage}>이미지 없음</div>
              )}
              <span className={styles.distance}>{attraction.distanceKm.toFixed(1)}km</span>
            </div>
            
            <div className={styles.content}>
              <h3 className={styles.name}>{attraction.name}</h3>
              <p className={styles.type}>
                {attraction.type === 'indoor' ? '실내' : 
                 attraction.type === 'outdoor' ? '야외' : '실내/야외'}
              </p>
              <p className={styles.address}>{attraction.address}</p>
              {attraction.description && (
                <p className={styles.description}>{attraction.description}</p>
              )}
              
              {attraction.tags && attraction.tags.length > 0 && (
                <div className={styles.tags}>
                  {attraction.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 