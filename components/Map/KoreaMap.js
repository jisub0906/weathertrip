import React, { useState, useEffect } from 'react';
import styles from '../../styles/KoreaMap.module.css';
import koreaGeoData from '../../public/TL_SCCO_CTPRVN.json';

/**
 * 대한민국 SVG 지도 컴포넌트
 * @param onRegionSelect - 지역 클릭 시 호출되는 콜백 (영문 코드)
 * @param selectedRegion - 선택된 지역 코드(영문)
 * @returns SVG 기반 대한민국 지도 UI
 */
export default function KoreaMap({ onRegionSelect, selectedRegion }) {
  // 각 지역별 SVG path 데이터를 저장하는 상태
  const [pathData, setPathData] = useState({});
  
  /**
   * [목적] GeoJSON 데이터를 SVG 경로(path) 데이터로 변환하여 상태에 저장합니다.
   * [의도] 지도 렌더링을 위한 SVG path 생성
   */
  useEffect(() => {
    // SVG viewBox 크기 정의
    const width = 800;
    const height = 800;
    
    /**
     * [목적] 지리 좌표(경도, 위도)를 SVG 좌표로 변환합니다.
     * @param coordinates - 변환할 좌표 배열
     * @returns 변환된 SVG 좌표 배열
     */
    function projectGeoToSvg(coordinates) {
      // 전체 지도 영역의 최소/최대값 계산
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      // 모든 지역의 좌표를 순회하며 최대/최소값 찾기
      koreaGeoData.features.forEach(feature => {
        if (feature.geometry.type === "MultiPolygon") {
          feature.geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              ring.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
              });
            });
          });
        } else if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates.forEach(ring => {
            ring.forEach(([x, y]) => {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            });
          });
        }
      });
      
      // SVG 패딩 및 스케일 계산
      const padding = 50;
      const xScale = (width - padding*2) / (maxX - minX);
      const yScale = (height - padding*2) / (maxY - minY);
      // 비율 유지(가로/세로 중 작은 쪽 기준)
      const scale = Math.min(xScale, yScale);
      // 좌표 변환 (y축 반전)
      return coordinates.map(([x, y]) => [
        padding + (x - minX) * scale,
        height - padding - (y - minY) * scale
      ]);
    }
    
    /**
     * [목적] GeoJSON Polygon/MultiPolygon을 SVG path 문자열로 변환합니다.
     * @param feature - GeoJSON Feature 객체
     * @returns SVG path 문자열
     */
    function createPathFromGeoJSON(feature) {
      let path = "";
      if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            const projectedRing = projectGeoToSvg(ring);
            projectedRing.forEach(([x, y], i) => {
              if (i === 0) path += `M${x},${y} `;
              else path += `L${x},${y} `;
            });
            path += "Z ";
          });
        });
      } else if (feature.geometry.type === "Polygon") {
        feature.geometry.coordinates.forEach(ring => {
          const projectedRing = projectGeoToSvg(ring);
          projectedRing.forEach(([x, y], i) => {
            if (i === 0) path += `M${x},${y} `;
            else path += `L${x},${y} `;
          });
          path += "Z ";
        });
      }
      return path;
    }
    
    // 각 지역의 SVG path 데이터 생성
    const paths = {};
    koreaGeoData.features.forEach(feature => {
      // 지역 코드(영문명)로 매핑
      const regionId = feature.properties.CTP_ENG_NM.toLowerCase();
      paths[regionId] = createPathFromGeoJSON(feature);
    });
    setPathData(paths);
  }, []);
  
  // GeoJSON 영문명 ↔ 한글명/코드 매핑 테이블
  const regionMapping = {
    'seoul': { nameKo: '서울', code: 'seoul' },
    'busan': { nameKo: '부산', code: 'busan' },
    'daegu': { nameKo: '대구', code: 'daegu' },
    'incheon': { nameKo: '인천', code: 'incheon' },
    'gwangju': { nameKo: '광주', code: 'gwangju' },
    'daejeon': { nameKo: '대전', code: 'daejeon' },
    'ulsan': { nameKo: '울산', code: 'ulsan' },
    'sejong-si': { nameKo: '세종', code: 'sejong' },
    'gyeonggi-do': { nameKo: '경기도', code: 'gyeonggi' },
    'gangwon-do': { nameKo: '강원도', code: 'gangwon' },
    'chungcheongbuk-do': { nameKo: '충청북도', code: 'chungbuk' },
    'chungcheongnam-do': { nameKo: '충청남도', code: 'chungnam' },
    'jeollabuk-do': { nameKo: '전라북도', code: 'jeonbuk' },
    'jeollanam-do': { nameKo: '전라남도', code: 'jeonnam' },
    'gyeongsangbuk-do': { nameKo: '경상북도', code: 'gyeongbuk' },
    'gyeongsangnam-do': { nameKo: '경상남도', code: 'gyeongnam' },
    'jeju-do': { nameKo: '제주도', code: 'jeju' }
  };
  
  /**
   * [목적] 각 지역의 SVG path를 렌더링합니다.
   * @returns SVG <path> 배열
   */
  const renderRegions = () => {
    return Object.keys(pathData).map((regionId) => {
      const mapping = regionMapping[regionId] || { nameKo: regionId, code: regionId };
      return (
        <path
          key={regionId}
          id={mapping.code}
          d={pathData[regionId]}
          className={`${styles.region} ${selectedRegion === mapping.code ? styles.selected : ''} ${styles[mapping.code]}`}
          onClick={() => onRegionSelect(mapping.code)}
          data-name={mapping.nameKo}
        >
          <title>{mapping.nameKo}</title>
        </path>
      );
    });
  };
  
  /**
   * [목적] 각 지역의 한글 레이블을 SVG에 표시합니다.
   * [의도] 지도 위에 지역명을 시각적으로 안내
   * @returns SVG <text> 배열
   */
  const renderRegionLabels = () => {
    // (실제 중심점 계산은 복잡하므로, 하드코딩된 위치 사용)
    return Object.entries(regionMapping).map(([id, info]) => {
      // 하드코딩된 레이블 위치 정보
      const labelPositions = {
        'seoul': {x: 400, y: 280},
        'busan': {x: 540, y: 470},
        // ... (다른 지역 위치 생략)
      };
      const pos = labelPositions[info.code] || {x: 0, y: 0};
      return (
        <text 
          key={info.code} 
          x={pos.x} 
          y={pos.y} 
          className={styles.regionLabel}
        >
          {info.nameKo}
        </text>
      );
    });
  };
  
  return (
    <div className={styles.mapSection}>
      <h1 className={styles.mapTitle}>대한민국 관광지 둘러보기</h1>
      <div className={styles.mapWrapper}>
        <svg 
          viewBox="0 0 800 800" 
          xmlns="http://www.w3.org/2000/svg"
          className={styles.mapSvg}
        >
          {/* GeoJSON에서 생성된 지역 경로 */}
          {Object.keys(pathData).length > 0 && renderRegions()}
          
          {/* 독도 명시적으로 추가 */}
          <circle
            cx="790"
            cy="290"
            r="1.6"
            fill="rgba(255, 180, 190, 1)"  /* 경상북도와 동일한 색상 */
            stroke="#000000"
            strokeWidth="0.5"
            className={styles.dokdo}
          />
        </svg>
      </div>
    </div>
  );
}