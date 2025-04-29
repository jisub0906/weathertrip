import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from '../../styles/AttractionsList.module.css';

/**
 * 관광지 리스트를 렌더링하는 통합 컴포넌트 (검색, 테마, 모바일, onClose 등 포함)
 * @param attractions - 관광지 배열
 * @param loading - 데이터 로딩 여부
 * @param error - 에러 메시지
 * @param weatherCondition - 날씨 조건(추천 메시지에 사용)
 * @param onAttractionClick - 관광지 카드 클릭 시 호출되는 콜백
 * @param isVisible - 목록 표시 여부 (선택)
 * @param onClose - 목록 닫기 콜백 (선택)
 * @returns 관광지 리스트 UI
 */
export default function AttractionsList({ attractions, loading, error, weatherCondition, onAttractionClick, isVisible = true, onClose }) {
  // 이미지가 로드된 URL을 저장하는 Set (이미지 페이드인 효과에 사용)
  const [loadedImages, setLoadedImages] = useState(new Set());
  // 프리로드된 이미지 URL을 저장하는 Set
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  // 현재 화면에 보여줄 관광지 개수 (초기 6개, 더보기 시 증가)
  const [visibleAttractions, setVisibleAttractions] = useState(6);
  // 검색어 상태 (관광지명/주소 검색)
  const [searchQuery, setSearchQuery] = useState('');
  // 선택된 테마 상태 (테마별 필터링)
  const [selectedTheme, setSelectedTheme] = useState(null);
  // 목록 확장 여부 (더보기/접기)
  const [isExpanded, setIsExpanded] = useState(false);
  // 목록 DOM ref (모바일 UX 등 활용 가능)
  const listRef = useRef(null);
  // 모바일 환경 여부 (반응형 UI)
  const [isMobile, setIsMobile] = useState(false);

  /**
   * [목적] 브라우저 창 크기 변화에 따라 모바일 환경 여부를 감지하여 상태에 반영합니다.
   * [의도] 모바일 환경에서는 UI/UX를 다르게 처리할 수 있도록 하기 위함입니다.
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  /**
   * [목적] 이미지 URL을 미리 로드하여, 실제 렌더링 시 빠르게 표시되도록 합니다.
   * @param url - 프리로드할 이미지 URL
   * @returns 프리로드 완료된 이미지 URL
   */
  const preloadImage = useCallback((url) => {
    return new Promise((resolve) => {
      if (preloadedImages.has(url)) {
        resolve(url);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, url]));
        resolve(url);
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }, [preloadedImages]);

  /**
   * [목적] 최초 렌더링 시, 화면에 보일 관광지들의 이미지를 미리 프리로드합니다.
   * [의도] 사용자 경험(UX) 향상 - 이미지 로딩 지연 최소화
   */
  useEffect(() => {
    const initialAttractions = attractions?.slice(0, visibleAttractions) || [];
    const initialImages = initialAttractions.map(attraction => 
      attraction.images?.[0]
    ).filter(Boolean);
    Promise.all(initialImages.map(preloadImage)).catch(() => {});
  }, [attractions, preloadImage, visibleAttractions]);

  /**
   * [목적] 이미지가 실제로 로드되었을 때 해당 URL을 loadedImages에 추가합니다.
   * @param url - 로드된 이미지 URL
   */
  const handleImageLoad = useCallback((url) => {
    setLoadedImages(prev => new Set([...prev, url]));
  }, []);

  /**
   * [목적] '더 많은 관광지 보기' 버튼 클릭 시, 추가 관광지를 노출합니다.
   * [의도] 한 번에 너무 많은 데이터를 렌더링하지 않고, 점진적으로 보여주기 위함입니다.
   */
  const loadMoreAttractions = useCallback(() => {
    setVisibleAttractions(prev => prev + 6);
  }, []);

  /**
   * [목적] 관광지 배열에서 모든 테마(태그) 목록을 추출하여 중복 없이 반환합니다.
   * [의도] 테마별 필터링 UI 제공
   */
  const themeList = React.useMemo(() => {
    if (!attractions) return [];
    const allTags = attractions.flatMap(a => a.tags || []);
    return Array.from(new Set(allTags));
  }, [attractions]);

  /**
   * [목적] 검색어/테마 필터가 적용된 관광지 목록을 반환합니다.
   * [의도] 사용자가 원하는 조건에 맞는 관광지만 보여주기 위함입니다.
   */
  const filteredAttractions = React.useMemo(() => {
    let list = attractions || [];
    // 검색어가 입력된 경우, 이름 또는 주소에 포함되는 관광지만 필터링
    if (searchQuery) {
      list = list.filter(a => a.name.includes(searchQuery) || (a.address && a.address.includes(searchQuery)));
    }
    // 테마가 선택된 경우, 해당 테마를 포함하는 관광지만 필터링
    if (selectedTheme) {
      list = list.filter(a => a.tags && a.tags.includes(selectedTheme));
    }
    return list;
  }, [attractions, searchQuery, selectedTheme]);

  /**
   * [목적] 관광지 카드 클릭 시, 상세 콜백 및 onClose(목록 닫기) 처리
   * @param attraction - 클릭된 관광지 객체
   */
  const handleAttractionClick = (attraction) => {
    if (onAttractionClick) onAttractionClick(attraction);
    if (onClose) onClose();
  };

  /**
   * [목적] 날씨 조건에 따라 추천 메시지를 반환합니다.
   * [의도] 사용자에게 상황에 맞는 안내 메시지 제공
   */
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

  // isVisible이 false면 렌더링하지 않음 (외부에서 목록 표시 제어)
  if (!isVisible) return null;

  // 로딩/에러/빈 목록 처리 (UX 일관성)
  if (loading) {
    return <div className={styles.loading}>관광지 정보를 불러오는 중...</div>;
  }
  if (error) {
    return <div className={styles.error}>오류: {error}</div>;
  }
  if (!filteredAttractions || filteredAttractions.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>주변에 추천할 관광지가 없습니다.</p>
        <p>검색 반경을 늘리거나 다른 위치에서 시도해보세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={listRef}>
      {/* 상단 검색/테마/닫기 UI - 사용자가 원하는 관광지 탐색 지원 */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="관광지명 또는 주소 검색"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {themeList.length > 0 && (
          <select
            value={selectedTheme || ''}
            onChange={e => setSelectedTheme(e.target.value || null)}
            className={styles.themeSelect}
          >
            <option value="">전체 테마</option>
            {themeList.map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        )}
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            닫기
          </button>
        )}
      </div>

      <h2 className={styles.title}>{getWeatherMessage()}</h2>
      <div className={styles.attractionsList}>
        {/* 관광지 카드 목록 렌더링 - 검색/테마/더보기 적용 */}
        {filteredAttractions.slice(0, isExpanded ? filteredAttractions.length : visibleAttractions).map((attraction) => (
          <div
            key={attraction._id}
            className={styles.attractionCard}
            onClick={() => handleAttractionClick(attraction)}
          >
            <div className={styles.imageContainer}>
              {attraction.images && attraction.images.length > 0 ? (
                <div className={styles.imageWrapper}>
                  <Image
                    src={attraction.images[0]}
                    alt={attraction.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={1}
                    priority={filteredAttractions.indexOf(attraction) < 2}
                    loading={filteredAttractions.indexOf(attraction) < 2 ? 'eager' : 'lazy'}
                    style={{
                      objectFit: 'cover',
                      opacity: loadedImages.has(attraction.images[0]) ? 1 : 0,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                    onLoad={() => handleImageLoad(attraction.images[0])}
                  />
                  {!loadedImages.has(attraction.images[0]) && (
                    <div className={styles.skeletonImage} />
                  )}
                </div>
              ) : (
                <div className={styles.noImage}>이미지 없음</div>
              )}
              <span className={styles.distance}>{attraction.distanceKm?.toFixed(1)}km</span>
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
      {/* 더보기/접기 버튼 - 목록 확장 UX */}
      {filteredAttractions.length > visibleAttractions && !isExpanded && (
        <button onClick={() => setIsExpanded(true)} className={styles.loadMoreButton}>
          더 많은 관광지 보기
        </button>
      )}
      {isExpanded && filteredAttractions.length > visibleAttractions && (
        <button onClick={() => setIsExpanded(false)} className={styles.loadMoreButton}>
          접기
        </button>
      )}
    </div>
  );
} 