import axios from 'axios';
import { forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../../styles/KakaoMap.module.css';
import AttractionDetail from '../Attractions/AttractionDetail';
import Image from 'next/image';

// 마커 이미지, 지도 설정 등 주요 상수 정의
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

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.9780 }; // 서울 시청 좌표(기본값)
const DEFAULT_ZOOM_LEVEL = 5; // 지도 기본 줌 레벨
const DEFAULT_RADIUS = 6; // 주변 탐색 기본 반경(km)
const MOBILE_CENTER_OFFSET_RATIO = 0.25; // 모바일에서 지도 중심을 위로 올릴 비율

/**
 * 카카오맵 기반 관광지 마커, 상세, 주변 탐색 등 지도 UI 제공 컴포넌트
 * @param center - 지도 중심 좌표
 * @param onMarkerClick - 마커 클릭 시 콜백
 * @param onNearbyAttractionsLoad - 주변 관광지 로드 시 콜백
 * @param onAllAttractionsLoad - 전체 관광지 로드 시 콜백
 * @param onCloseDetail - 상세 닫기 콜백
 * @param isNearbyMode - 주변 탐색 모드 여부
 * @param onListClose - 상세 열릴 때 목록 닫기 콜백
 * @param ref - imperative handle
 * @returns 카카오맵 UI
 */
const KakaoMap = forwardRef(function KakaoMap({ 
  center, 
  onMarkerClick, 
  onNearbyAttractionsLoad, 
  onAllAttractionsLoad, 
  onCloseDetail, 
  isNearbyMode,
  onListClose
}, ref) {
  // 지도/마커/상태 관련 ref 및 state
  const mapRef = useRef(null); // 지도 DOM ref
  const mapInstanceRef = useRef(null); // 카카오맵 인스턴스 ref
  const [allAttractionsCached, setAllAttractionsCached] = useState([]); // 전체 관광지 캐시
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const debounceTimerRef = useRef(null); // 디바운스 타이머 ref
  const markersRef = useRef([]); // 관광지 마커 ref
  const isMapInitializedRef = useRef(false); // 지도 초기화 여부 ref
  const [selectedAttraction, setSelectedAttraction] = useState(null); // 선택된 관광지
  const [isMapReady, setIsMapReady] = useState(false); // 지도 준비 여부
  const locationMarkerRef = useRef(null); // 현재 위치 마커 ref
  const searchMarkerRef = useRef(null); // 검색 마커 ref
  const infoWindowRef = useRef(null); // 정보창 ref
  const [loadedImages, setLoadedImages] = useState(new Set()); // 이미지 로딩 상태
  const [preloadedImages, setPreloadedImages] = useState(new Set()); // 이미지 프리로드 상태
  const [isMobile, setIsMobile] = useState(false); // 모바일 환경 여부

  /**
   * [목적] 브라우저 창 크기 변화에 따라 모바일 환경 여부를 감지하여 상태에 반영합니다.
   * [의도] 모바일 환경에서는 지도 중심 이동 등 UX를 다르게 처리하기 위함입니다.
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
   * [목적] 마커 이미지 등 주요 이미지를 미리 로드합니다.
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
   * [목적] 마커 이미지 프리로드 (최초 렌더링 시)
   */
  useEffect(() => {
    const markerImages = [
      MARKER_CONFIG.DEFAULT.path,
      MARKER_CONFIG.CURRENT_LOCATION.path,
      ...Object.values(MARKER_CONFIG.THEME)
    ];
    Promise.all(markerImages.map(preloadImage)).catch(() => {});
  }, [preloadImage]);

  /**
   * [목적] 이미지가 실제로 로드되었을 때 해당 URL을 loadedImages에 추가합니다.
   * @param url - 로드된 이미지 URL
   */
  const handleImageLoad = useCallback((url) => {
    setLoadedImages(prev => new Set([...prev, url]));
  }, []);

  /**
   * [목적] 관광지 태그에 따라 마커 이미지 경로를 반환합니다.
   * @param tags - 관광지 태그 배열
   * @returns 해당 테마에 맞는 마커 이미지 경로
   */
  const getMarkerImagePath = useCallback((tags) => {
    if (!Array.isArray(tags)) return MARKER_CONFIG.DEFAULT.path;
    const tagString = tags.join(',');
    for (const [category, path] of Object.entries(MARKER_CONFIG.THEME)) {
      if (tagString.includes(category)) {
        return path;
      }
    }
    return MARKER_CONFIG.DEFAULT.path;
  }, []);

  /**
   * [목적] 마커 이미지를 생성합니다.
   * @param imagePath - 마커 이미지 경로
   * @param size - 마커 크기
   * @param offsetPoint - 마커 기준점
   * @returns 카카오맵 MarkerImage 객체
   */
  const createMarkerImage = useCallback((imagePath, size = MARKER_CONFIG.DEFAULT.size, offsetPoint = MARKER_CONFIG.DEFAULT.offset) => {
    return new window.kakao.maps.MarkerImage(
      imagePath,
      new window.kakao.maps.Size(size, size),
      { offset: new window.kakao.maps.Point(offsetPoint.x, offsetPoint.y) }
    );
  }, []);

  /**
   * [목적] 지도 위의 정보창(커스텀 오버레이)을 닫습니다.
   */
  const closeInfoWindow = useCallback(() => {
    if (infoWindowRef.current) {
      infoWindowRef.current.setMap(null);
      infoWindowRef.current = null;
    }
  }, []);

  /**
   * [목적] 기존 마커/오버레이 등 지도 위의 모든 요소를 제거합니다.
   */
  const clearMarkers = useCallback(() => {
    closeInfoWindow();
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
      locationMarkerRef.current = null;
    }
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
      searchMarkerRef.current = null;
    }
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  }, [closeInfoWindow]);

  /**
   * [목적] 마커 클릭 시 상세 오버레이를 띄우고, 선택 상태를 갱신합니다.
   * @param marker - 클릭된 마커 객체
   * @param attraction - 해당 관광지 객체
   * @param map - 지도 인스턴스
   */
  const handleMarkerClick = useCallback((marker, attraction, map) => {
    if (infoWindowRef.current) {
      infoWindowRef.current.setMap(null);
      infoWindowRef.current = null;
    }
    const position = marker.getPosition();
    map.panTo(position);
    map.setLevel(4);
    if (onMarkerClick) onMarkerClick(attraction);
    setSelectedAttraction(attraction);
    // 커스텀 오버레이(말풍선) 생성 및 표시
    const content = document.createElement('div');
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
    const customOverlay = new window.kakao.maps.CustomOverlay({
      content,
      position: marker.getPosition(),
      xAnchor: 0.5,
      yAnchor: 1.2
    });
    customOverlay.setMap(map);
    infoWindowRef.current = customOverlay;
  }, [onMarkerClick]);

  /**
   * [목적] 현재 위치 마커를 지도에 표시합니다.
   * @param location - 현재 위치 좌표
   * @param map - 지도 인스턴스
   * @returns 생성된 마커 객체
   */
  const showCurrentLocationMarker = useCallback((location, map) => {
    if (!location || !map) return null;
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
    }
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
    locationMarkerRef.current = marker;
    return marker;
  }, [createMarkerImage]);

  /**
   * [목적] 관광지 마커를 지도에 생성하고, 클릭 이벤트를 바인딩합니다.
   * @param attraction - 관광지 객체
   * @param map - 지도 인스턴스
   * @returns 생성된 마커 객체
   */
  const createAttractionMarker = useCallback((attraction, map) => {
    if (!attraction || !map) return null;
    const coords = attraction.location.coordinates;
    const position = new window.kakao.maps.LatLng(coords[1], coords[0]);
    const marker = new window.kakao.maps.Marker({
      position,
      map,
      title: attraction.name,
      image: createMarkerImage(getMarkerImagePath(attraction.tags))
    });
    markersRef.current.push(marker);
    window.kakao.maps.event.addListener(marker, 'click', function () {
      handleMarkerClick(marker, attraction, map);
    });
    return marker;
  }, [createMarkerImage, getMarkerImagePath, handleMarkerClick]);

  /**
   * [목적] 전체 관광지 정보를 불러와 마커로 표시합니다.
   * @param map - 지도 인스턴스
   */
  const fetchAllAttractions = useCallback(async (map) => {
    if (!map) return;
    setIsLoading(true);
    try {
      if (allAttractionsCached.length > 0) {
        if (onAllAttractionsLoad) {
          onAllAttractionsLoad(allAttractionsCached);
        }
        clearMarkers();
        allAttractionsCached.forEach(attraction => createAttractionMarker(attraction, map));
        setIsLoading(false);
        return;
      }
      const response = await axios.get('/api/attractions/all');
      if (response.data.attractions) {
        const allAttractions = response.data.attractions;
        setAllAttractionsCached(allAttractions);
        if (onAllAttractionsLoad) {
          onAllAttractionsLoad(allAttractions);
        }
        clearMarkers();
        allAttractions.forEach(attraction => createAttractionMarker(attraction, map));
      }
    } catch (error) {
      // 관광지 정보 가져오기 실패 시 사용자에게 알림
      alert('관광지 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [onAllAttractionsLoad, allAttractionsCached, clearMarkers, createAttractionMarker]);

  /**
   * [목적] 주변 관광지 정보를 불러와 마커로 표시합니다.
   * @param location - 기준 위치 좌표
   * @param map - 지도 인스턴스
   * @param radius - 탐색 반경(기본 6km)
   */
  const fetchNearbyAttractions = useCallback(async (location, map, radius = DEFAULT_RADIUS) => {
    if (!location || !map) return;
    setIsLoading(true);
    try {
      clearMarkers();
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
        if (onNearbyAttractionsLoad) {
          onNearbyAttractionsLoad(newAttractions);
        }
        showCurrentLocationMarker(location, map);
        newAttractions.forEach(attraction => createAttractionMarker(attraction, map));
      }
    } catch (error) {
      // 주변 관광지 정보 가져오기 실패 시 사용자에게 알림
      alert('주변 관광지 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [clearMarkers, onNearbyAttractionsLoad, showCurrentLocationMarker, createAttractionMarker]);

  /**
   * [목적] 지도 중심점을 이동시킵니다. (모바일은 offset 적용)
   * @param lat - 위도
   * @param lng - 경도
   */
  const moveToPosition = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;
    const position = new window.kakao.maps.LatLng(lat, lng);
    if (isMobile) {
      // 모바일에서는 지도 중심을 약간 위로 이동 (화면 높이의 MOBILE_CENTER_OFFSET_RATIO 만큼)
      const height = mapRef.current?.clientHeight || 0;
      const offset = height * MOBILE_CENTER_OFFSET_RATIO;
      const bounds = mapInstanceRef.current.getBounds();
      const boundsHeight = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();
      const latOffset = (boundsHeight * offset) / height;
      const offsetPosition = new window.kakao.maps.LatLng(lat - latOffset, lng);
      mapInstanceRef.current.setCenter(offsetPosition);
    } else {
      mapInstanceRef.current.setCenter(position);
    }
  }, [isMobile]);

  /**
   * [목적] 위도/경도로 지도 이동
   * @param lat - 위도
   * @param lng - 경도
   */
  const moveToCoords = useCallback((lat, lng) => {
    moveToPosition(lat, lng);
  }, [moveToPosition]);

  /**
   * [목적] 현재 위치로 지도 이동 및 주변 관광지 표시
   */
  const moveToCurrentLocation = useCallback(() => {
    if (!mapInstanceRef.current || !center) return;
    moveToPosition(center.latitude, center.longitude);
    showCurrentLocationMarker(center, mapInstanceRef.current);
    fetchNearbyAttractions(center, mapInstanceRef.current);
  }, [center, fetchNearbyAttractions, showCurrentLocationMarker, moveToPosition]);

  /**
   * [목적] 카카오맵을 최초 1회만 초기화합니다.
   * [의도] SSR 방지, 중복 초기화 방지, 지도 컨트롤/마커/이벤트 등 세팅
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (isMapInitializedRef.current) return;
    if (!window.kakao?.maps) {
      alert('카카오맵 SDK가 로드되지 않았습니다.');
      return;
    }
    let unmounted = false;
    const timer = debounceTimerRef.current;
    window.kakao.maps.load(() => {
      if (unmounted) return;
      try {
        const options = {
          center: new window.kakao.maps.LatLng(
            center?.latitude || DEFAULT_CENTER.latitude,
            center?.longitude || DEFAULT_CENTER.longitude
          ),
          level: DEFAULT_ZOOM_LEVEL
        };
        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
        isMapInitializedRef.current = true;
        setIsMapReady(true);
        if (center) {
          moveToPosition(center.latitude, center.longitude);
          showCurrentLocationMarker(center, map);
        }
        if (!unmounted) {
          fetchAllAttractions(map);
        }
      } catch (error) {
        alert('지도를 불러오는데 문제가 발생했습니다. 페이지를 새로고침 해주세요.');
      }
    });
    return () => {
      unmounted = true;
      if (timer) {
        clearTimeout(timer);
      }
      clearMarkers();
      closeInfoWindow();
    };
  }, [center, clearMarkers, fetchAllAttractions, closeInfoWindow, showCurrentLocationMarker]);

  /**
   * [목적] 외부에서 관광지 클릭 시 상세 표시
   * @param attraction - 선택된 관광지 객체
   */
  const handleAttractionClick = useCallback((attraction) => {
    setSelectedAttraction(attraction);
  }, []);

  /**
   * [목적] 관광지 상세 닫기
   */
  const handleCloseDetail = useCallback(() => {
    setSelectedAttraction(null);
    if (onCloseDetail) {
      onCloseDetail();
    }
  }, [onCloseDetail]);

  /**
   * [목적] 검색 위치 마커를 지도에 추가합니다.
   * @param lat - 위도
   * @param lng - 경도
   */
  const addSearchMarker = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
    }
    const position = new window.kakao.maps.LatLng(lat, lng);
    const marker = new window.kakao.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: '검색 위치'
    });
    searchMarkerRef.current = marker;
    mapInstanceRef.current.setCenter(position);
  }, []);

  // imperative handle로 외부에서 지도 제어 함수 노출
  useImperativeHandle(ref, () => ({
    handleAttractionClick,
    moveToCurrentLocation,
    fetchAllAttractions: (map) => fetchAllAttractions(map || mapInstanceRef.current),
    moveToCoords,
    addSearchMarker,
    mapInstance: mapInstanceRef.current,
    mapReady: isMapReady,
    closeDetail: handleCloseDetail
  }), [
    handleAttractionClick, 
    moveToCurrentLocation, 
    fetchAllAttractions, 
    moveToCoords,
    addSearchMarker,
    isMapReady,
    handleCloseDetail
  ]);

  /**
   * [목적] 주변 탐색 모드(isNearbyMode) 변경 시 마커를 업데이트합니다.
   * [의도] 전체/주변 관광지 모드 전환 시 지도 상태 동기화
   */
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

  /**
   * [목적] 관광지 상세정보가 열릴 때 목록을 닫습니다.
   * [의도] 상세와 목록이 동시에 보이지 않도록 UX 제어
   */
  useEffect(() => {
    if (selectedAttraction && onListClose) {
      onListClose();
    }
  }, [selectedAttraction, onListClose]);

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