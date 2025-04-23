import axios from 'axios';
import { forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../../styles/KakaoMap.module.css';
import AttractionDetail from '../Attractions/AttractionDetail';
import Image from 'next/image';

// 상수 정의 - 설정을 쉽게 변경할 수 있도록 최상단으로 분리
const MARKER_CONFIG = {
  DEFAULT: {
    path: '/marker_blue.png',
    size: 40,
    offset: { x: 20, y: 40 }
  },
  CURRENT_LOCATION: {
    path: '/marker_pink.png',
    size: 40,
    offset: { x: 20, y: 40 }
  },
  THEME: {
    '자연/힐링': '/marker_green.png',
    '종교/역사/전통': '/marker_red.png',
    '체험/학습/산업': '/marker_blue.png',
    '문화/예술': '/marker_purple.png',
    '캠핑/스포츠': '/marker_orange.png',
    '쇼핑/놀이': '/marker_white.png'
  }
};

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.9780 };
const DEFAULT_ZOOM_LEVEL = 5;
const DEFAULT_RADIUS = 6;

const KakaoMap = forwardRef(function KakaoMap({ 
  center, 
  onMarkerClick, 
  onNearbyAttractionsLoad, 
  onAllAttractionsLoad, 
  onCloseDetail, 
  isNearbyMode 
}, ref) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [allAttractionsCached, setAllAttractionsCached] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const markersRef = useRef([]);
  const isMapInitializedRef = useRef(false);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const locationMarkerRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const infoWindowRef = useRef(null); // 현재 열린 정보창 참조를 위해 추가
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [preloadedImages, setPreloadedImages] = useState(new Set());

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

  useEffect(() => {
    // 마커 이미지 프리로드
    const markerImages = [
      MARKER_CONFIG.DEFAULT.path,
      MARKER_CONFIG.CURRENT_LOCATION.path,
      ...Object.values(MARKER_CONFIG.THEME)
    ];

    Promise.all(markerImages.map(preloadImage))
      .catch(error => console.error('마커 이미지 프리로드 실패:', error));
  }, [preloadImage]);

  const handleImageLoad = useCallback((url) => {
    setLoadedImages(prev => new Set([...prev, url]));
  }, []);

  // 마커 이미지 경로를 테마에 따라 반환 (개선된 버전)
  const getMarkerImagePath = useCallback((tags) => {
    if (!Array.isArray(tags)) return MARKER_CONFIG.DEFAULT.path;

    // 태그 배열을 문자열로 변환하여 검색
    const tagString = tags.join(',');

    // 카테고리별 마커 이미지 매핑
    for (const [category, path] of Object.entries(MARKER_CONFIG.THEME)) {
      if (tagString.includes(category)) {
        return path;
      }
    }

    return MARKER_CONFIG.DEFAULT.path;
  }, []);

  // 마커 이미지 생성 함수 (재사용성 향상)
  const createMarkerImage = useCallback((imagePath, size = MARKER_CONFIG.DEFAULT.size, offsetPoint = MARKER_CONFIG.DEFAULT.offset) => {
    return new window.kakao.maps.MarkerImage(
      imagePath,
      new window.kakao.maps.Size(size, size),
      { offset: new window.kakao.maps.Point(offsetPoint.x, offsetPoint.y) }
    );
  }, []);

  // 정보창 닫기 함수 (공통 처리)
  const closeInfoWindow = useCallback(() => {
    if (infoWindowRef.current) {
      infoWindowRef.current.setMap(null);
      infoWindowRef.current = null;
    }
  }, []);

  // 이전 마커 제거 함수 (개선)
  const clearMarkers = useCallback(() => {
    // 정보창 닫기
    closeInfoWindow();
    
    // 위치 마커 제거
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
      locationMarkerRef.current = null;
    }
    
    // 검색 마커 제거
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
      searchMarkerRef.current = null;
    }
    
    // 관광지 마커 제거
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  }, [closeInfoWindow]);

  // 마커 클릭 이벤트 핸들러 (공통 처리)
  const handleMarkerClick = useCallback((marker, attraction, map) => {
    // 기존 커스텀 오버레이 제거
    if (infoWindowRef.current) {
      infoWindowRef.current.setMap(null);  // 기존 말풍선 닫기
      infoWindowRef.current = null;
    }
    
    // 마커 중심으로 지도 이동 및 확대대
    const position = marker.getPosition();
    map.panTo(position); // 🔄 애니메이션 이동
    map.setLevel(4); // 🔍 확대 레벨 고정 (원하는 확대 수준, 1이 최대 줌)
  
    // 3. 선택 상태 저장
    if (onMarkerClick) onMarkerClick(attraction);
    setSelectedAttraction(attraction);
  
    // 커스텀 오버레이의 콘텐츠 DOM 생성
    const content = document.createElement('div');
    // 말풍선 스타일 설정정
    content.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 13px;
        color: #333;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        white-space: nowrap;
        border: none;
      ">
        <div style="font-weight: bold; font-size: 14px;">${attraction.name}</div>
        <div style="margin-top: 4px; color: #888;">
          ${attraction.address || ''}
        </div>
<div style="margin-top: 4px; font-size: 12px; color: #555;">
  유형: ${attraction.type === 'indoor' ? '실내' : attraction.type === 'outdoor' ? '야외' : '실내/야외'}
  &nbsp;|&nbsp;
  테마: <span style="color: #0077cc;">${attraction.tags?.[0] || '정보 없음'}</span>
</div>
      </div>
    `;
  
    // 커스텀 오버레이 생성
    const customOverlay = new window.kakao.maps.CustomOverlay({
      content,
      position: marker.getPosition(),
      xAnchor: 0.5,
      yAnchor: 1.2 // 말풍선을 마커 위에 띄움
    });
  
    // 지도에 오버레이 표시
    customOverlay.setMap(map);
    infoWindowRef.current = customOverlay;
  }, [onMarkerClick]);

  // 현재 위치 마커 표시
  const showCurrentLocationMarker = useCallback((location, map) => {
    if (!location || !map) return null;
    
    // 기존 위치 마커가 있다면 제거
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
    }

    // 현재 위치 마커 생성
    const position = new window.kakao.maps.LatLng(location.latitude, location.longitude);
    const marker = new window.kakao.maps.Marker({
      position,
      map,
      title: '현재 위치',
      image: createMarkerImage(
        MARKER_CONFIG.CURRENT_LOCATION.path,
        MARKER_CONFIG.CURRENT_LOCATION.size,
        MARKER_CONFIG.CURRENT_LOCATION.offset
      )
    });

    // 현재 위치 마커 참조 저장
    locationMarkerRef.current = marker;


    return marker;
  }, [createMarkerImage]);

  // 관광지 마커 생성 (공통 로직)
  const createAttractionMarker = useCallback((attraction, map) => {
    if (!attraction || !map) return null;
    
    const coords = attraction.location.coordinates;
    const position = new window.kakao.maps.LatLng(coords[1], coords[0]);

    // 마커 생성
    const marker = new window.kakao.maps.Marker({
      position,
      map,
      title: attraction.name,
      image: createMarkerImage(getMarkerImagePath(attraction.tags))
    });

    // 마커 참조 저장
    markersRef.current.push(marker);

    // 마커 클릭 이벤트
    window.kakao.maps.event.addListener(marker, 'click', function () {
      handleMarkerClick(marker, attraction, map);
    });

    return marker;
  }, [createMarkerImage, getMarkerImagePath, handleMarkerClick]);

  // 모든 관광지 정보 가져오기 (개선)
  const fetchAllAttractions = useCallback(async (map) => {
    if (!map) return;

    setIsLoading(true);

    try {
      // 캐시된 데이터가 있으면 재사용
      if (allAttractionsCached.length > 0) {
        // 부모 컴포넌트에 관광지 목록 전달
        if (onAllAttractionsLoad) {
          onAllAttractionsLoad(allAttractionsCached);
        }

        // 기존 마커 제거
        clearMarkers();

        // 마커 생성
        allAttractionsCached.forEach(attraction => createAttractionMarker(attraction, map));
        
        setIsLoading(false);
        return;
      }

      // 캐시된 데이터가 없을 경우에만 API 호출
      const response = await axios.get('/api/attractions/all');

      if (response.data.attractions) {
        const allAttractions = response.data.attractions;
        setAllAttractionsCached(allAttractions); // 데이터 캐시

        // 부모 컴포넌트에 관광지 목록 전달
        if (onAllAttractionsLoad) {
          onAllAttractionsLoad(allAttractions);
        }

        // 기존 마커 제거
        clearMarkers();

        // 관광지 마커 생성
        allAttractions.forEach(attraction => createAttractionMarker(attraction, map));
      }
    } catch (error) {
      console.error('관광지 정보 가져오기 오류:', error);
      // 사용자에게 오류 알림 표시 추가
      alert('관광지 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [onAllAttractionsLoad, allAttractionsCached, clearMarkers, createAttractionMarker]);

  // 주변 관광지 정보 가져오기 (개선)
  const fetchNearbyAttractions = useCallback(async (location, map, radius = DEFAULT_RADIUS) => {
    if (!location || !map) return;

    setIsLoading(true);

    try {
      // 이전 마커 제거
      clearMarkers();

      // API를 통해 주변 관광지 정보 가져오기
      const response = await axios.get('/api/attractions/attractions', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
          limit: 20
        }
      });

      if (response.data.attractions) {
        const newAttractions = response.data.attractions;

        // 부모 컴포넌트에 관광지 목록 전달
        if (onNearbyAttractionsLoad) {
          onNearbyAttractionsLoad(newAttractions);
        }

        // 현재 위치 마커 표시
        showCurrentLocationMarker(location, map);

        // 관광지 마커 생성
        newAttractions.forEach(attraction => createAttractionMarker(attraction, map));
      }
    } catch (error) {
      console.error('관광지 정보 가져오기 오류:', error);
      // 사용자에게 오류 알림 표시 추가
      alert('주변 관광지 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [clearMarkers, onNearbyAttractionsLoad, showCurrentLocationMarker, createAttractionMarker]);

  // 현재 위치로 이동 및 주변 정보 표시 (개선)
  const moveToCurrentLocation = useCallback(() => {
    if (!mapInstanceRef.current || !center) return;

    // 지도 중앙 위치 변경
    const newCenter = new window.kakao.maps.LatLng(center.latitude, center.longitude);
    mapInstanceRef.current.setCenter(newCenter);

    // 현재 위치 마커 표시
    showCurrentLocationMarker(center, mapInstanceRef.current);

    // 주변 관광지 정보 가져오기
    fetchNearbyAttractions(center, mapInstanceRef.current);

  }, [center, fetchNearbyAttractions, showCurrentLocationMarker]);

  // 카카오맵 초기화 (한 번만 실행)
  useEffect(() => {
    // 서버 사이드 렌더링 방지
    if (typeof window === 'undefined' || !mapRef.current) return;

    // 이미 초기화된 경우 다시 실행하지 않음
    if (isMapInitializedRef.current) return;

    // 지도가 이미 초기화되었는지 확인
    if (!window.kakao?.maps) {
      console.error('카카오맵 SDK가 로드되지 않았습니다.');
      return;
    }

    let unmounted = false;
    const timer = debounceTimerRef.current;

    // 처음 초기화하는 경우에만 실행
    window.kakao.maps.load(() => {
      // 컴포넌트가 이미 언마운트되었다면 초기화하지 않음
      if (unmounted) return;
      
      try {
        // 지도 옵션
        const options = {
          center: new window.kakao.maps.LatLng(
            center?.latitude || DEFAULT_CENTER.latitude,
            center?.longitude || DEFAULT_CENTER.longitude
          ),
          level: DEFAULT_ZOOM_LEVEL
        };

        // 지도 인스턴스 생성
        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;

        // 지도 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        isMapInitializedRef.current = true;
        setIsMapReady(true);

        // 현재 위치 표시
        if (center) {
          showCurrentLocationMarker(center, map);
        }

        // 관광지 정보 가져오기
        if (!unmounted) {
          fetchAllAttractions(map);
        }
      } catch (error) {
        console.error('카카오맵 초기화 중 오류 발생:', error);
        alert('지도를 불러오는데 문제가 발생했습니다. 페이지를 새로고침 해주세요.');
      }
    });

    // 클린업 함수
    return () => {
      unmounted = true;
      if (timer) {
        clearTimeout(timer);
      }
      
      // 이벤트 리스너 정리 및 마커 제거
      clearMarkers();
      
      // 정보창 닫기
      closeInfoWindow();
    };
  }, [center, clearMarkers, fetchAllAttractions, closeInfoWindow, showCurrentLocationMarker]);

  // 관광지 클릭 처리 (외부에서 호출)
  const handleAttractionClick = useCallback((attraction) => {
    setSelectedAttraction(attraction);
  }, []);

  // 선택한 관광지 상세 정보 닫기
  const handleCloseDetail = useCallback(() => {
    setSelectedAttraction(null);
    if (onCloseDetail) {
      onCloseDetail();
    }
  }, [onCloseDetail]);

  // 좌표로 지도 이동
  const moveToCoords = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;
    
    const center = new window.kakao.maps.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(center);
  }, []);

  // 검색 마커 추가
  const addSearchMarker = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;

    // 기존 검색 마커 제거
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
    }

    // 새 검색 마커 생성
    const position = new window.kakao.maps.LatLng(lat, lng);
    const marker = new window.kakao.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: '검색 위치'
    });

    searchMarkerRef.current = marker;
    
    // 지도 중심 이동
    mapInstanceRef.current.setCenter(position);
  }, []);

  // 부모 컴포넌트에서 호출할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    handleAttractionClick,
    moveToCurrentLocation,
    fetchAllAttractions: (map) => fetchAllAttractions(map || mapInstanceRef.current),
    moveToCoords,
    addSearchMarker,
    mapInstance: mapInstanceRef.current,
    mapReady: isMapReady
  }), [
    handleAttractionClick, 
    moveToCurrentLocation, 
    fetchAllAttractions, 
    moveToCoords,
    addSearchMarker,
    isMapReady
  ]);

  // isNearbyMode가 변경될 때 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      clearMarkers();

      if (isNearbyMode) {
        if (center) {
          await fetchNearbyAttractions(center, mapInstanceRef.current);
        }
      } else {
        await fetchAllAttractions(mapInstanceRef.current);
      }
    };

    updateMarkers();
  }, [isNearbyMode, center, clearMarkers, fetchAllAttractions, fetchNearbyAttractions]);

  return (
    <div className={styles.mapContainer}>
      {selectedAttraction && (
        <AttractionDetail
          attraction={selectedAttraction}
          onClose={handleCloseDetail}
        />
      )}
      <div ref={mapRef} className={styles.mapContent}></div>
      {isLoading && (
        <div className={styles.mapLoadingOverlay}>
          <div className={styles.mapLoadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
          <p>관광지 불러오는 중...</p>
        </div>
      )}
    </div>
  );
});

KakaoMap.displayName = 'KakaoMap';

export default KakaoMap;