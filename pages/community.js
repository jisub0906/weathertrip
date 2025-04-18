import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Community.module.css';
import Header from '../components/Layout/Header';

export default function Community() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { ref, inView } = useInView();
  const lastAttractionElementRef = useRef(null);
  
  // 페이지네이션 상태 관리
  const lastTimestampRef = useRef(null);
  const lastIdRef = useRef(null);
  const reviewsSetRef = useRef(new Set()); // 중복 방지를 위한 Set

  const [pullStartY, setPullStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullThreshold = 100; // 새로고침을 트리거할 거리 (픽셀)

  const handleCardClick = (attraction) => {
    if (!attraction?.name) return;
    localStorage.setItem('searchKeyword', attraction.name);
    localStorage.setItem('selectedAttractionId', attraction._id);
    window.location.href = '/map';
  };

  // 리뷰 데이터 가져오기
  const fetchReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      let url = `/api/attractions/reviews?limit=10`;
      if (!isRefresh && lastTimestampRef.current && lastIdRef.current) {
        url += `&lastTimestamp=${lastTimestampRef.current}&lastId=${lastIdRef.current}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      const newReviews = data.reviews.filter(review => 
        !reviewsSetRef.current.has(review._id)
      );

      if (isRefresh) {
        // 새로고침 시 새로운 리뷰만 상단에 추가
        setReviews(prev => {
          const updatedReviews = [...newReviews, ...prev];
          // 중복 제거
          const seen = new Set();
          return updatedReviews.filter(review => {
            if (seen.has(review._id)) return false;
            seen.add(review._id);
            return true;
          });
        });
      } else {
        // 무한 스크롤 시 하단에 추가
        setReviews(prev => [...prev, ...newReviews]);
      }

      // Set에 새로운 리뷰 ID 추가
      newReviews.forEach(review => {
        reviewsSetRef.current.add(review._id);
      });
      
      // 페이지네이션 정보 업데이트
      setHasMore(data.pagination.hasNextPage);
      if (data.pagination.lastTimestamp) {
        lastTimestampRef.current = data.pagination.lastTimestamp;
        lastIdRef.current = data.pagination.lastId;
      }
    } catch (error) {
      console.error('리뷰 로딩 오류:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    fetchReviews();
  }, []);

  // 무한 스크롤
  useEffect(() => {
    if (inView && !loading && hasMore) {
      fetchReviews();
    }
  }, [inView, loading, hasMore]);

  // 스크롤 상단 갱신
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let refreshTimeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 스크롤이 최상단에 도달하고, 위로 스크롤 중일 때
      if (currentScrollY === 0 && lastScrollY > currentScrollY && !isRefreshing) {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          fetchReviews(true);
        }, 500); // 디바운스 처리
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(refreshTimeout);
    };
  }, [isRefreshing]);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    // 최상단에서만 작동
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartY === 0 || isRefreshing) return;

    const pullDistance = e.touches[0].clientY - pullStartY;
    if (pullDistance > 0 && window.scrollY === 0) {
      setIsPulling(true);
      // 브라우저 기본 스크롤 동작 방지
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);
    setPullStartY(0);

    // 충분한 거리를 당겼을 때 새로고침 실행
    if (window.scrollY === 0) {
      await fetchReviews(true);
    }
  };

  // 터치 이벤트 리스너 등록
  useEffect(() => {
    const options = { passive: false };
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullStartY, isPulling, isRefreshing]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <>
      <Header />
      <div 
        className={`${styles.pullToRefresh} ${isPulling ? styles.pulling : ''} ${isRefreshing ? styles.refreshing : ''}`}
      >
        <div className={styles.pullIndicator}>
          {!isRefreshing ? (
            <>
              <svg
                className={styles.arrowIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
              {isPulling ? '놓아서 새로고침' : '당겨서 새로고침'}
            </>
          ) : (
            <>
              <div className={styles.refreshSpinner} />
              새로운 리뷰를 불러오는 중...
            </>
          )}
        </div>
      </div>

      <main className={styles.container}>
        <h1 className={styles.title}>커뮤니티</h1>
        
        <div className={styles.reviewList}>
          {reviews.map((review, index) => {
            const isLastElement = index === reviews.length - 1;
            return (
              <div key={review._id} className={styles.reviewCard}>
                {/* 사용자 이름 & 날짜 */}
                <div className={styles.reviewHeader}>
                  <span className={styles.userName}>{review.user?.name || '익명'}</span>
                  <span className={styles.date}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                
                {/* 관광지 정보 */}
                <div className={styles.attractionContainer}>
                  <div
                      key={review.attraction._id || index}
                      className={styles.attractionLink}
                      ref={isLastElement ? lastAttractionElementRef : null}
                      onClick={() => handleCardClick(review.attraction)}
                      >
                    <div className={styles.attractionInfo}>
                      <div className={styles.attractionContent}>
                        <div className={styles.locationRow}>
                          <svg 
                            className={styles.locationIcon} 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <h3 className={styles.attractionName}>{review.attraction.name}</h3>
                        </div>
                        <div className={styles.viewDetailText}>관광지 상세보기 →</div>
                      </div>
                      
                      {review.attraction.images?.[0] && (
                        <Image
                          src={review.attraction.images[0]}
                          alt={review.attraction.name}
                          width={100}
                          height={100}
                          className={styles.attractionImage}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 리뷰 내용 */}
                {review.content && (
                  <div className={styles.reviewContent}>
                    <p>{review.content}</p>
                  </div>
                )}
              </div>
            );
          })}
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner} />
              리뷰를 불러오는 중...
            </div>
          )}
          
          {!loading && !hasMore && (
            <div className={styles.noMore}>
              더 이상 리뷰가 없습니다.
            </div>
          )}
          
          <div ref={ref} style={{ height: '10px' }} />
        </div>
      </main>
    </>
  );
}