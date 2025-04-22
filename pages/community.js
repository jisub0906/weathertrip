import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import styles from "../styles/Community.module.css";
import Header from "../components/Layout/Header";
import LanguageToggleButton from "../components/Translate/LanguageToggleButton";

export default function Community() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { ref, inView } = useInView();
  const [selectedLang, setSelectedLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // 리뷰 번역을 위한 언어 선택
  const translateReviewContent = async (text, lang) => {
    try {
      // 화살표 기호를 임시로 제거하고 번역
      const textToTranslate = text.replace(' →', '');
      
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, targetLang: lang }),
      });
      const result = await res.json();
      
      // 번역된 텍스트에 화살표 추가 (원본 텍스트가 화살표를 포함하고 있었을 경우에만)
      const translatedText = result.translations?.[0]?.text || text;
      return text.includes('→') ? `${translatedText} →` : translatedText;
    } catch (error) {
      console.error('번역 실패:', error);
      return text;
    }
  };
  
  const originalReviewsRef = useRef(new Map());

  // 리뷰가 변경되거나 언어가 선택되면 번역 실행
  useEffect(() => {
    if (!selectedLang || reviews.length === 0 || isTranslating) return;
  
    if (selectedLang === 'KO') {
      // 한국어 선택 시 원본 복원
      const originalReviews = Array.from(originalReviewsRef.current.values());
      setReviews(originalReviews);
      return;
    }
  
    // 번역이 필요한 리뷰만 필터링
    const untranslatedReviews = reviews.filter(review => 
      !review.translations?.[selectedLang] || 
      !review.attraction.translations?.[selectedLang]
    );
  
    if (untranslatedReviews.length === 0) return;
  
    // 번역 실행
    const translateAll = async () => {
      setIsTranslating(true);
      try {
        const translatedReviews = await Promise.all(
          reviews.map(async (review) => {
            // 이미 번역된 리뷰는 재사용
            if (review.translations?.[selectedLang]) {
              return review;
            }
            
            // 원본 저장
            if (!originalReviewsRef.current.has(review._id)) {
              originalReviewsRef.current.set(review._id, { ...review });
            }
            
            // 새로운 번역 수행
            const translatedContent = await translateReviewContent(review.content, selectedLang);
            const translatedName = await translateReviewContent(review.attraction.name, selectedLang);
            const translatedLabel = await translateReviewContent("관광지 상세보기 →", selectedLang);
            
            return {
              ...review,
              content: translatedContent,
              translations: {
                ...(review.translations || {}),
                [selectedLang]: translatedContent
              },
              attraction: {
                ...review.attraction,
                name: translatedName,
                translations: {
                  ...(review.attraction.translations || {}),
                  [selectedLang]: translatedName
                }
              },
              translatedLabel
            };
          })
        );
        
        setReviews(translatedReviews);
      } catch (error) {
        console.error('번역 중 오류 발생:', error);
      } finally {
        setIsTranslating(false);
      }
    };
  
    translateAll();
  }, [selectedLang, reviews]);

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
      </main>
    </>
  );
}