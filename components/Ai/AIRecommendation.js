import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/AIRecommendation.module.css';

export default function AIRecommendation({ weather, activeFilters }) {
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!weather || !activeFilters) return;

    const getRecommendation = async () => {
      try {
        setLoading(true);
        setError(null);

        const requestData = {
          weatherCondition: weather.condition,
          temperature: weather.temperature,
          recommendationType: activeFilters.type,
          category: activeFilters.tag
        };
        
        console.log('Sending request with data:', requestData);

        const response = await axios.post('/api/ai/travelRecommend', requestData);

        console.log('Received response:', response.data);

        if (response.data.success) {
          setRecommendation(response.data.recommendation);
        } else {
          throw new Error(response.data.message || '응답에 실패했습니다.');
        }
      } catch (err) {
        console.error('AI 추천 요청 중 오류 발생:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });

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

  if (loading) {
    return (
      <div className={styles.aiRecommendation}>
        <p className={styles.loading}>AI가 여행을 추천하고 있습니다...</p>
      </div>
    );
  }

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

  if (!recommendation) {
    return null;
  }

  return (
    <div className={styles.aiRecommendation}>
      <div className={styles.recommendationContent}>
        <h4>Weather-Trip의 한 마디</h4>
        <p className={styles.recommendationText}>{recommendation}</p>
      </div>
    </div>
  );
} 