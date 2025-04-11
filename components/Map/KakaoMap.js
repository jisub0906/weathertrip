import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import styles from '../../styles/Map.module.css';
import AttractionDetail from '../Attractions/AttractionDetail';

const KakaoMap = forwardRef(function KakaoMap({ center, onMarkerClick, onNearbyAttractionsLoad }, ref) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [attractions, setAttractions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const markersRef = useRef([]);
  const isMapInitializedRef = useRef(false);
  const previousCenterRef = useRef(null);
  const [showNearbyButton, setShowNearbyButton] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  
  // 이전 마커 제거 함수
  const clearMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  }, []);
  
  // 지연 함수(debounce) - 지도 이동 시 과도한 API 호출 방지
  const debounce = (callback, delay) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(callback, delay);
  };
  
  // 모든 관광지 정보 가져오기
  const fetchAllAttractions = useCallback(async (map) => {
    if (!map) return;
    
    setIsLoading(true);
    
    try {
      // 이전 마커 제거
      clearMarkers();
      
      const response = await axios.get('/api/attractions/all');
      
      if (response.data.attractions) {
        const allAttractions = response.data.attractions;
        setAttractions(allAttractions);
        
        // 부모 컴포넌트에 관광지 목록 전달
        if (onNearbyAttractionsLoad) {
          onNearbyAttractionsLoad(allAttractions);
        }
        
        // 관광지 마커 생성
        allAttractions.forEach(attraction => {
          const coords = attraction.location.coordinates;
          const position = new window.kakao.maps.LatLng(coords[1], coords[0]);
          
          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            position: position,
            map: map,
            title: attraction.name
          });
          
          // 마커 참조 저장
          markersRef.current.push(marker);
          
          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', function() {
            if (onMarkerClick) {
              onMarkerClick(attraction);
            }
            // 상세 정보 표시
            setSelectedAttraction(attraction);
            
            // 간단한 인포윈도우 생성
            const content = `
              <div style="padding:8px;width:220px;">
                <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:bold;">${attraction.name}</h3>
                <p style="margin:0;font-size:12px;color:#666;">
                  ${attraction.type === 'indoor' ? '실내' : 
                    attraction.type === 'outdoor' ? '야외' : '실내/야외'}
                </p>
              </div>
            `;
            
            const infoWindow = new window.kakao.maps.InfoWindow({
              content: content,
              removable: true
            });
            
            infoWindow.open(map, marker);
          });
        });
      }
    } catch (error) {
      console.error('관광지 정보 가져오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearMarkers, onMarkerClick, onNearbyAttractionsLoad]);
  
  // 주변 관광지 정보 가져오기
  const fetchNearbyAttractions = useCallback(async (location, map, radius = 3) => {
    if (!location || !map) return;
    
    // 이전에 동일한 위치로 이미 요청한 경우 중복 요청 방지
    if (previousCenterRef.current) {
      const prevLat = previousCenterRef.current.latitude;
      const prevLng = previousCenterRef.current.longitude;
      const currLat = location.latitude;
      const currLng = location.longitude;
      
      // 위치가 정확히 같으면 요청 중복 방지
      if (prevLat === currLat && prevLng === currLng) {
        return;
      }
    }
    
    // 현재 위치 기록
    previousCenterRef.current = { ...location };
    
    setIsLoading(true);
    
    try {
      // 이전 마커 제거
      clearMarkers();
      
      const response = await axios.get('/api/attractions', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: radius, // 반경(km) - 줌 레벨에 따라 동적으로 변경
          limit: 20 // 최대 20개만 가져오도록 제한
        }
      });
      
      if (response.data.attractions) {
        const newAttractions = response.data.attractions;
        setAttractions(newAttractions);
        
        // 부모 컴포넌트에 관광지 목록 전달
        if (onNearbyAttractionsLoad) {
          onNearbyAttractionsLoad(newAttractions);
        }
        
        // 관광지 마커 생성
        newAttractions.forEach(attraction => {
          const coords = attraction.location.coordinates;
          const position = new window.kakao.maps.LatLng(coords[1], coords[0]);
          
          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            position: position,
            map: map,
            title: attraction.name
          });
          
          // 마커 참조 저장
          markersRef.current.push(marker);
          
          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', function() {
            if (onMarkerClick) {
              onMarkerClick(attraction);
            }
            // 상세 정보 표시
            setSelectedAttraction(attraction);
            
            // 간단한 인포윈도우 생성
            const content = `
              <div style="padding:8px;width:220px;">
                <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:bold;">${attraction.name}</h3>
                <p style="margin:0;font-size:12px;color:#666;">
                  ${attraction.type === 'indoor' ? '실내' : 
                    attraction.type === 'outdoor' ? '야외' : '실내/야외'}
                </p>
                <p style="margin:4px 0 0 0;font-size:12px;color:#333;">
                  ${(attraction.distanceKm || 0).toFixed(1)}km
                </p>
              </div>
            `;
            
            const infoWindow = new window.kakao.maps.InfoWindow({
              content: content,
              removable: true
            });
            
            infoWindow.open(map, marker);
          });
        });
      }
    } catch (error) {
      console.error('관광지 정보 가져오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearMarkers, onMarkerClick, onNearbyAttractionsLoad]);
  
  // 현재 위치로 이동 및 주변 정보 표시
  const moveToCurrentLocation = useCallback(() => {
    if (!mapInstanceRef.current || !center) return;
    
    // 지도 중앙 위치 변경
    const newCenter = new window.kakao.maps.LatLng(center.latitude, center.longitude);
    mapInstanceRef.current.setCenter(newCenter);
    
    // 주변 관광지 정보 가져오기
    fetchNearbyAttractions(center, mapInstanceRef.current);
    
  }, [center, fetchNearbyAttractions]);
  
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
    
    // 처음 초기화하는 경우에만 실행
    window.kakao.maps.load(() => {
      try {
        // 지도 옵션
        const options = {
          center: new window.kakao.maps.LatLng(
            center?.latitude || 37.5665, 
            center?.longitude || 126.9780
          ),
          level: 5 // 지도 확대 레벨
        };
        
        // 지도 인스턴스 생성
        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;
        
        // 지도 컨트롤 추가
        // 줌 컨트롤
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
        
        // 타입 컨트롤 (일반 지도, 스카이뷰)
        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
        
        // 지도 이동 완료 이벤트 - 새로운 관광지 로딩 (디바운스 처리)
        window.kakao.maps.event.addListener(map, 'dragend', function() {
          // 이제 드래그 시에는 API 호출하지 않음
        });
        
        // 줌 변경 이벤트
        window.kakao.maps.event.addListener(map, 'zoom_changed', function() {
          // 이제 줌 변경 시에는 API 호출하지 않음
        });
        
        // 초기화 완료 표시
        isMapInitializedRef.current = true;
        
        // 현재 위치 마커 표시
        if (center) {
          const locationMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(center.latitude, center.longitude),
            map: map,
            title: '현재 위치'
          });
          
          // 현재 위치 정보 창
          const infoContent = '<div style="padding:5px;width:150px;text-align:center;"><strong>현재 위치</strong></div>';
          const infoWindow = new window.kakao.maps.InfoWindow({
            content: infoContent
          });
          infoWindow.open(map, locationMarker);
        }
        
        // 전체 관광지 정보 로드
        fetchAllAttractions(map);
        
        // 현재 위치 표시 버튼 활성화
        if (center) {
          setShowNearbyButton(true);
        }
      } catch (error) {
        console.error('카카오맵 초기화 오류:', error);
      }
    });
    
    // 컴포넌트 언마운트 시 클린업 함수
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearMarkers();
    };
  }, [fetchAllAttractions, center, clearMarkers]);
  
  // 중앙 위치 변경 시에만 현재 위치 마커 업데이트
  useEffect(() => {
    if (!isMapInitializedRef.current || !mapInstanceRef.current || !center) return;
    
    // 현재 위치 버튼 표시
    setShowNearbyButton(true);
    
  }, [center]);
  
  // 관광지 목록 클릭 시 상세 정보 표시 (부모 컴포넌트에서 호출 가능)
  const handleAttractionClick = useCallback((attraction) => {
    setSelectedAttraction(attraction);
  }, []);
  
  // 선택한 관광지 상세 정보 닫기
  const handleCloseDetail = useCallback(() => {
    setSelectedAttraction(null);
  }, []);
  
  // 부모 컴포넌트에서 호출할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    handleAttractionClick
  }), [handleAttractionClick]);
  
  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.mapContent}></div>
      {showNearbyButton && (
        <button 
          className={styles.currentLocationBtn}
          onClick={moveToCurrentLocation}
        >
          내 주변 관광지 보기
        </button>
      )}
      {isLoading && (
        <div className={styles.mapLoadingOverlay}>
          <div className={styles.mapLoadingSpinner}></div>
          <p>관광지 불러오는 중...</p>
        </div>
      )}
      {selectedAttraction && (
        <AttractionDetail 
          attraction={selectedAttraction} 
          onClose={handleCloseDetail} 
        />
      )}
    </div>
  );
});

KakaoMap.displayName = 'KakaoMap';

export default KakaoMap; 