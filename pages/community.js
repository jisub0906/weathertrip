import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import styles from "../styles/Community.module.css";
import Header from "../components/Layout/Header";
import LanguageToggleButton from "../components/Translate/LanguageToggleButton";
import Quiz from '../components/Quiz/Quiz';

export default function Community() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { ref, inView } = useInView();
  const [selectedLang, setSelectedLang] = useState('');
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' 또는 'quiz'
  const [quizData, setQuizData] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  
  // 리뷰 번역을 위한 언어 선택
  const translateReviewContent = async (text, lang) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: lang }),
      });
      const result = await res.json();
      return result.translations?.[0]?.text || text;
    } catch (error) {
      console.error('번역 실패:', error);
      return text;
    }
  };
  
  const originalReviewsRef = useRef([]);

  // 리뷰가 변경되거나 언어가 선택되면 번역 실행
  useEffect(() => {
    if (!selectedLang || reviews.length === 0) return;
  
    // 원본 저장 (한 번만)
    if (!originalReviewsRef.current.length) {
      originalReviewsRef.current = [...reviews];
    }
  
    if (selectedLang === 'KO') {
      // 한국어 선택 시 원본 복원
      setReviews([...originalReviewsRef.current]);
      return;
    }
  
    // 번역 실행
    const translateAll = async () => {
      const translated = await Promise.all(
        originalReviewsRef.current.map(async (rev) => ({
          ...rev,
          content: await translateReviewContent(rev.content, selectedLang),
          attraction: {
            ...rev.attraction,
            name: await translateReviewContent(rev.attraction.name, selectedLang),
          },
          translatedLabel: await translateReviewContent("관광지 상세보기 →", selectedLang),
        }))
      );
      setReviews(translated);
    };
  
    translateAll();
  }, [selectedLang]);

  // Pagination state management
  const lastTimestampRef = useRef(null);
  const lastIdRef = useRef(null);
  const reviewsSetRef = useRef(new Set()); // Set to prevent duplicates
  
  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullThreshold = 100; // Distance to trigger refresh (pixels)

  const handleCardClick = (attraction) => {
    if (!attraction?.name) return;
    localStorage.setItem("searchKeyword", attraction.name);
    localStorage.setItem("selectedAttractionId", attraction._id);
    window.location.href = "/map";
  };

  // Fetch review data
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

      const newReviews = data.reviews.filter(
        (review) => !reviewsSetRef.current.has(review._id)
      );

      if (isRefresh) {
        // Add new reviews to the top on refresh
        setReviews((prev) => {
          const updatedReviews = [...newReviews, ...prev];
          // Remove duplicates
          const seen = new Set();
          return updatedReviews.filter((review) => {
            if (seen.has(review._id)) return false;
            seen.add(review._id);
            return true;
          });
        });
      } else {
        // Add to bottom for infinite scroll
        setReviews((prev) => [...prev, ...newReviews]);
      }

      // Add new review IDs to the Set
      newReviews.forEach((review) => {
        reviewsSetRef.current.add(review._id);
      });

      // Update pagination info
      setHasMore(data.pagination.hasNextPage);
      if (data.pagination.lastTimestamp) {
        lastTimestampRef.current = data.pagination.lastTimestamp;
        lastIdRef.current = data.pagination.lastId;
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial loading
  useEffect(() => {
    fetchReviews();
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (inView && !loading && hasMore) {
      fetchReviews();
    }
  }, [inView, loading, hasMore]);

  // Top scroll refresh
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let refreshTimeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // When scroll reaches top and is scrolling up
      if (
        currentScrollY === 0 &&
        lastScrollY > currentScrollY &&
        !isRefreshing
      ) {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          fetchReviews(true);
        }, 500); // Debounce
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(refreshTimeout);
    };
  }, [isRefreshing]);

  // Touch event handlers
  const handleTouchStart = (e) => {
    // Only work at the top
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartY === 0 || isRefreshing) return;

    const pullDistance = e.touches[0].clientY - pullStartY;
    if (pullDistance > 0 && window.scrollY === 0) {
      setIsPulling(true);
      // Prevent default browser scroll behavior
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);
    setPullStartY(0);

    // Execute refresh if pulled far enough
    if (window.scrollY === 0) {
      await fetchReviews(true);
    }
  };

  // Register touch event listeners
  useEffect(() => {
    const options = { passive: false };
    document.addEventListener("touchstart", handleTouchStart, options);
    document.addEventListener("touchmove", handleTouchMove, options);
    document.addEventListener("touchend", handleTouchEnd, options);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullStartY, isPulling, isRefreshing]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Component for the review card to improve code organization
  const ReviewCard = ({ review, isLastElement }) => (
    <div className={styles.reviewCard}>
      {/* User name & date */}
      <div className={styles.reviewHeader}>
        <span className={styles.userName}>{review.user?.name || '익명'}</span>
        <span className={styles.date}>
          {formatDate(review.createdAt)}
        </span>
      </div>

      {/* Container that wraps attraction and review */}
      <div className={styles.contentContainer}>
        {/* Attraction information - left side */}
        <div className={styles.attractionContainer}>
          <div
            className={styles.attractionLink}
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
                  <h3 className={styles.attractionName}>
                    {review.attraction.name}
                  </h3>
                </div>
                <div className={styles.viewDetailText}>
                {review.translatedLabel || "관광지 상세보기 →"}
                </div>
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

        {/* Review content - right side */}
        {review.content && (
          <div className={styles.reviewContent}>
            <p>{review.content}</p>
          </div>
        )}
      </div>
    </div>
  );

  // 퀴즈 데이터 가져오기
  const fetchQuizData = async () => {
    try {
      setQuizLoading(true);
      const response = await fetch('/api/quiz/quiz');
      if (!response.ok) {
        throw new Error('퀴즈 데이터를 가져오는데 실패했습니다');
      }
      const data = await response.json();
      setQuizData(data);
    } catch (error) {
      console.error("퀴즈 데이터 로딩 오류:", error);
    } finally {
      setQuizLoading(false);
    }
  };

  // 탭이 변경될 때 해당 데이터 로드
  useEffect(() => {
    if (activeTab === 'quiz' && quizData.length === 0) {
      fetchQuizData();
    }
  }, [activeTab]);

  return (
    <>
      <Header />
      <LanguageToggleButton onSelect={(lang) => setSelectedLang(lang)} />
      <div
        className={`${styles.pullToRefresh} ${
          isPulling ? styles.pulling : ""
        } ${isRefreshing ? styles.refreshing : ""}`}
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
              {isPulling ? "놓아서 새로고침" : "당겨서 새로고침"}
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
        
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            리뷰
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'quiz' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            퀴즈
          </button>
        </div>

        {activeTab === 'reviews' ? (
          <div className={styles.reviewList}>
            {reviews.map((review, index) => (
              <ReviewCard
                key={review._id}
                review={review}
                isLastElement={index === reviews.length - 1}
                // Fixed: Don't pass ref directly to a component prop as it causes infinite renders
                lastAttractionElementRef={null}
              />
            ))}

            {loading && (
              <div className={styles.loading}>
                <div className={styles.loadingSpinner} />
                리뷰를 불러오는 중...
              </div>
            )}

            {!loading && !hasMore && (
              <div className={styles.noMore}>더 이상 리뷰가 없습니다.</div>
            )}

            {/* This is the correct place to add the InView ref */}
            <div ref={ref} style={{ height: "10px" }} />
          </div>
        ) : (
          <div className={styles.quizSection}>
            {quizLoading ? (
              <div className={styles.loading}>
                <div className={styles.loadingSpinner} />
                퀴즈를 불러오는 중...
              </div>
            ) : (
              <>
                <p className={styles.subtitle}>한국의 관광지에 대한 퀴즈를 풀어보세요!</p>
                <Quiz questions={quizData} />
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}