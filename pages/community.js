import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import styles from "../styles/Community.module.css";
import Header from "../components/Layout/Header";
import LanguageToggleButton from "../components/Translate/LanguageToggleButton";
import Quiz from "../components/Quiz/Quiz";

/**
 * 커뮤니티 페이지 컴포넌트
 * - 관광지 리뷰 목록, 퀴즈, 다국어 번역, 무한 스크롤, 당겨서 새로고침 등 다양한 커뮤니티 기능 제공
 * @returns JSX.Element - 커뮤니티 UI
 */
export default function Community() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { ref, inView } = useInView();
  const [selectedLang, setSelectedLang] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState("reviews"); // 'reviews' 또는 'quiz'
  const [translatedQuizData, setTranslatedQuizData] = useState([]);
  const [translatedSubtitle, setTranslatedSubtitle] = useState(
    "한국의 관광지에 대한 퀴즈를 풀어보세요!"
  );
  const [quizData, setQuizData] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const originalReviewsRef = useRef(new Map());

  /**
   * 리뷰 번역을 위한 언어 선택
   * @param text - 번역할 문자열
   * @param lang - 대상 언어 코드
   * @returns Promise<string> - 번역된 문자열(실패 시 원본 반환)
   */
  const translateReviewContent = async (text, lang) => {
    try {
      if (!text || !lang) return text;
      const textToTranslate = text.replace(" →", "");
      const res = await fetch("/api/translate/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, targetLang: lang }),
      });
      if (!res.ok) {
        return text; // 번역 실패 시 원본 반환
      }
      const result = await res.json();
      const translatedText = result.translations?.[0]?.text || text;
      return text.includes("→") ? `${translatedText} →` : translatedText;
    } catch (error) {
      return text;
    }
  };

  /**
   * 퀴즈 번역을 위한 언어 선택
   * @param quiz - 퀴즈 객체
   * @param lang - 대상 언어 코드
   * @returns Promise<object> - 번역된 퀴즈 객체
   */
  const translateQuizContent = async (quiz, lang) => {
    try {
      const translatedQuestion = await translateReviewContent(
        quiz.question,
        lang
      );
      const translatedOptions = await Promise.all(
        quiz.options.map((option) => translateReviewContent(option, lang))
      );
      const translatedExplanation = await translateReviewContent(
        quiz.explanation,
        lang
      );
      return {
        ...quiz,
        question: translatedQuestion,
        options: translatedOptions,
        explanation: translatedExplanation,
      };
    } catch (error) {
      return quiz;
    }
  };

  // 퀴즈 번역을 위한 언어 선택
  useEffect(() => {
    if (!selectedLang || quizData.length === 0 || selectedLang === 'KO') {
      setTranslatedQuizData([]); // 초기화
      return;
    }
  
    const translateAllQuizzes = async () => {
      setIsTranslating(true);
      try {
        // ✅ 번역할 퀴즈를 일부로 제한 (예: 앞에서 3문제만)
        const sliceSize = 3;
        const limitedQuizzes = quizData.slice(0, sliceSize);
  
        const translated = await Promise.all(
          limitedQuizzes.map((quiz) => translateQuizContent(quiz, selectedLang))
        );
  
        const subtitle = await translateReviewContent(
          '한국의 관광지에 대한 퀴즈를 풀어보세요!',
          selectedLang
        );
  
        setTranslatedQuizData(translated);
        setTranslatedSubtitle(subtitle);
      } catch (err) {
        console.error('퀴즈 번역 오류:', err);
      } finally {
        setIsTranslating(false);
      }
    };
  
    translateAllQuizzes();
  }, [selectedLang, quizData]);

  // 리뷰가 변경되거나 언어가 선택되면 번역 실행
  useEffect(() => {
    if (!selectedLang || reviews.length === 0 || isTranslating) return;

    if (selectedLang === "KO") {
      // 한국어 선택 시 원본 복원
      const originalReviews = Array.from(originalReviewsRef.current.values());
      setReviews(originalReviews);
      return;
    }

    // 번역이 필요한 리뷰만 필터링
    const untranslatedReviews = reviews.filter(
      (review) =>
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
            const translatedContent = await translateReviewContent(
              review.content,
              selectedLang
            );
            const translatedName = await translateReviewContent(
              review.attraction.name,
              selectedLang
            );
            const translatedLabel = await translateReviewContent(
              "관광지 상세보기 →",
              selectedLang
            );

            return {
              ...review,
              content: translatedContent,
              translations: {
                ...(review.translations || {}),
                [selectedLang]: translatedContent,
              },
              attraction: {
                ...review.attraction,
                name: translatedName,
                translations: {
                  ...(review.attraction.translations || {}),
                  [selectedLang]: translatedName,
                },
              },
              translatedLabel,
            };
          })
        );

        setReviews(translatedReviews);
      } catch (error) {
        console.error("번역 중 오류 발생:", error);
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

  /**
   * 리뷰 카드 클릭 시 관광지 상세 페이지로 이동
   * @param attraction - 관광지 객체
   */
  const handleCardClick = (attraction) => {
    if (!attraction?.name) return;
    localStorage.setItem("searchKeyword", attraction.name);
    localStorage.setItem("selectedAttractionId", attraction._id);
    window.location.href = "/map";
  };

  /**
   * 리뷰 데이터(무한 스크롤/새로고침) 비동기 로드
   * @param isRefresh - true면 새로고침, false면 추가 로드
   */
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
        // 새로고침 시 상단에 추가, 중복 제거
        setReviews((prev) => {
          const updatedReviews = [...newReviews, ...prev];
          const seen = new Set();
          return updatedReviews.filter((review) => {
            if (seen.has(review._id)) return false;
            seen.add(review._id);
            return true;
          });
        });
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }
      newReviews.forEach((review) => {
        reviewsSetRef.current.add(review._id);
      });
      setHasMore(data.pagination.hasNextPage);
      if (data.pagination.lastTimestamp) {
        lastTimestampRef.current = data.pagination.lastTimestamp;
        lastIdRef.current = data.pagination.lastId;
      }
    } catch (error) {
      // 리뷰 로드 실패 시 무시(별도 처리 불필요)
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
    if (inView && !loading && hasMore && activeTab === "reviews") {
      fetchReviews();
    }
  }, [inView, loading, hasMore, activeTab]);

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
        !isRefreshing &&
        activeTab === "reviews"
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
  }, [isRefreshing, activeTab]);

  // Touch event handlers
  const handleTouchStart = (e) => {
    // Only work at the top
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartY === 0 || isRefreshing || activeTab !== "reviews") return;

    const pullDistance = e.touches[0].clientY - pullStartY;
    if (pullDistance > 0 && window.scrollY === 0) {
      setIsPulling(true);
      // Prevent default browser scroll behavior
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing || activeTab !== "reviews") return;

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
  }, [pullStartY, isPulling, isRefreshing, activeTab]);

  /**
   * 날짜 포맷 변환 함수
   * @param dateString - ISO 날짜 문자열
   * @returns string - yyyy년 m월 d일
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  /**
   * 리뷰 카드 렌더링 컴포넌트
   * @param review - 리뷰 객체
   * @param isLastElement - 마지막 요소 여부(무한 스크롤 ref용)
   * @returns JSX.Element
   */
  const ReviewCard = ({ review, isLastElement }) => (
    <div className={styles.reviewCard}>
      {/* 유저명/날짜 */}
      <div className={styles.reviewHeader}>
        <span className={styles.userName}>{review.user?.nickname || "익명"}</span>
        <span className={styles.date}>{formatDate(review.createdAt)}</span>
      </div>
      {/* 관광지/리뷰 컨테이너 */}
      <div className={styles.contentContainer}>
        {/* 관광지 정보(좌측) */}
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
        {/* 리뷰 내용(우측) */}
        {review.content && (
          <div className={styles.reviewContent}>
            <p>{review.content}</p>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * 퀴즈 데이터 비동기 로드
   */
  const fetchQuizData = async () => {
    try {
      setQuizLoading(true);
      const response = await fetch("/api/quiz/quiz");
      if (!response.ok) {
        throw new Error("퀴즈 데이터를 가져오는데 실패했습니다");
      }
      const data = await response.json();
      setQuizData(data);
    } catch (error) {
      // 퀴즈 데이터 로드 실패 시 무시(별도 처리 불필요)
    } finally {
      setQuizLoading(false);
    }
  };

  // 탭이 변경될 때 해당 데이터 로드
  useEffect(() => {
    if (activeTab === "quiz" && quizData.length === 0) {
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
            className={`${styles.tabButton} ${
              activeTab === "reviews" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            리뷰
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "quiz" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("quiz")}
          >
            퀴즈
          </button>
        </div>

        {activeTab === "reviews" ? (
          <div className={styles.reviewList}>
            {reviews.map((review, index) => (
              <ReviewCard
                key={review._id}
                review={review}
                isLastElement={index === reviews.length - 1}
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
                <p className={styles.subtitle}>
                  {isTranslating ? "번역 중..." : translatedSubtitle}
                </p>
                {quizData.length === 0 ? (
                  <div className={styles.loading}>
                    퀴즈 데이터를 불러올 수 없습니다.
                  </div>
                ) : isTranslating ? (
                  <div className={styles.loading}>
                    <div className={styles.loadingSpinner} />
                    번역 중...
                  </div>
                ) : (
                  <Quiz
                    questions={
                      translatedQuizData.length > 0
                        ? translatedQuizData
                        : quizData
                    }
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
