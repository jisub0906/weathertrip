import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/AIRecommendation.module.css';

/**
 * AI 여행 추천 결과를 표시하는 컴포넌트
 * @param weather - 현재 날씨 정보 객체 (condition, temperature 등)
 * @param activeFilters - 사용자가 선택한 추천 필터(type, tag 등)
 * @returns 날씨와 필터에 따른 AI 여행 추천 UI
 */
export default function AIRecommendation({ weather, activeFilters }) {
  // AI 추천 결과 텍스트
  const [recommendation, setRecommendation] = useState('');
  // 로딩 상태
  const [loading, setLoading] = useState(false);
  // 에러 메시지 상태
  const [error, setError] = useState(null);

  useEffect(() => {
    // weather, activeFilters가 없으면 요청하지 않음
    if (!weather || !activeFilters) return;

    /**
     * AI 추천 결과를 서버에 요청하는 비동기 함수
     * - 요청 데이터: 날씨 정보와 필터 조건
     * - 성공 시 추천 결과 상태 업데이트
     * - 실패 시 에러 메시지 상태 업데이트
     */
    const getRecommendation = async () => {
      try {
        setLoading(true);
        setError(null);

        // 서버에 전달할 요청 데이터 객체
        const requestData = {
          weatherCondition: weather.condition,
          temperature: weather.temperature,
          recommendationType: activeFilters.type,
          category: activeFilters.tag
        };

        // AI 추천 API 호출
        const response = await axios.post('/api/ai/travelRecommend', requestData);

        // 성공적으로 추천 결과를 받은 경우
        if (response.data.success) {
          setRecommendation(response.data.recommendation);
        } else {
          // 서버에서 실패 응답을 반환한 경우 예외 처리
          throw new Error(response.data.message || '응답에 실패했습니다.');
        }
      } catch (err) {
        // 에러 발생 시 사용자에게 보여줄 메시지 가공
        let errorMessage = '여행 추천을 생성하는 중 오류가 발생했습니다.';
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getRecommendation();
  }, [weather, activeFilters]);

  // 로딩 중일 때 표시되는 UI
  if (loading) {
    return (
      <div className={styles.aiRecommendation}>
        <p className={styles.loading}>AI가 여행을 추천하고 있습니다...</p>
      </div>
    );
  }

  // 에러 발생 시 표시되는 UI
  if (error) {
    return (
      <div className={styles.aiRecommendation}>
        <p className={styles.error}>
          {typeof error === 'string' ? error : '여행 추천을 생성하는 중 오류가 발생했습니다.'}
        </p>
        <p className={styles.errorDetails}>다시 시도해주세요.</p>
      </div>
    );
  }

  // 추천 결과가 없으면 아무것도 렌더링하지 않음
  if (!recommendation) {
    return null;
  }

  // 추천 결과가 있을 때 표시되는 UI
  return (
    <div className={styles.aiRecommendation}>
      <div className={styles.recommendationContent}>
        <h4>Weather-Trip의 한 마디</h4>
        <p className={styles.recommendationText}>{recommendation}</p>
      </div>
    </div>
  );
} 