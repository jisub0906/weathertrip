import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import styles from '../../styles/AttractionDetail.module.css';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { HeaderHeightContext } from '../../src/contexts/HeaderHeightContext';

/**
 * 관광지 상세 정보 모달 컴포넌트
 * @param attraction - 상세 정보를 표시할 관광지 객체
 * @param onClose - 상세 모달 닫기 콜백 함수
 * @param onDetailOpen - 상세 모달이 열릴 때 부모에 알리는 콜백 함수
 * @returns 관광지 상세 정보 모달 UI
 */
export default function AttractionDetail({ attraction, onClose, onDetailOpen }) {
  // 로그인 세션 정보
  const { data: session, status } = useSession();
  // 좋아요 여부 상태
  const [liked, setLiked] = useState(null);
  // 리뷰 입력값 상태
  const [review, setReview] = useState('');
  // 관광지에 달린 리뷰 목록
  const [reviews, setReviews] = useState([]);
  // 리뷰 작성 중 여부
  const [submitting, setSubmitting] = useState(false);
  // 좋아요 수
  const [likeCount, setLikeCount] = useState(attraction.likeCount || 0);
  // 리뷰 로딩 상태
  const [loading, setLoading] = useState(true);
  // 리뷰 최대 길이 상수
  const MAX_REVIEW_LENGTH = 100;
  // 이미지 로딩 관련 상태
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const [visibleImages, setVisibleImages] = useState(3); // 초기에 보여줄 이미지 수
  // 기타 UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [weather, setWeather] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  // ref 및 컨텍스트
  const mapRef = useRef(null);
  const detailRef = useRef(null);
  // 모바일 환경 여부
  const [isMobile, setIsMobile] = useState(false);
  // 헤더 높이(모바일에서 위치 보정용)
  const headerHeight = useContext(HeaderHeightContext);

  // 모바일 환경 감지 및 상태 반영
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

  // 상세정보가 열릴 때 부모에 알림
  useEffect(() => {
    if (attraction && onDetailOpen) {
      onDetailOpen();
    }
  }, [attraction, onDetailOpen]);

  // 이미지 배열이 없거나 비어있는 경우 기본 이미지 사용
  const initialImages = attraction.images && attraction.images.length > 0
    ? attraction.images
    : ['/next.svg'];

  /**
   * 이미지 프리로드 함수
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

  // 초기 이미지 및 리뷰 이미지 프리로드
  useEffect(() => {
    const initialImages = attraction.images?.slice(0, visibleImages) || [];
    const reviewImages = attraction.reviews?.slice(0, 2).map(review => review.image).filter(Boolean) || [];
    Promise.all([...initialImages, ...reviewImages].map(preloadImage))
      .catch(() => {/* 프리로드 실패 시 무시 */});
  }, [attraction, preloadImage, visibleImages]);

  /**
   * 이미지 로드 완료 시 호출되는 콜백
   * @param url - 로드된 이미지 URL
   */
  const handleImageLoad = useCallback((url) => {
    setLoadedImages(prev => new Set([...prev, url]));
  }, []);

  /**
   * '더 보기' 버튼 클릭 시 추가 이미지 노출
   */
  const loadMoreImages = useCallback(() => {
    setVisibleImages(prev => prev + 3);
  }, []);

  // 리뷰 데이터 불러오기 (컴포넌트 마운트 시)
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // 리뷰 데이터 API 호출
        const response = await axios.get(`/api/attractions/${attraction._id}/review`);
        // 응답에 리뷰가 있다면 reviews 상태에 저장
        if (response.data.reviews) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        // 리뷰 데이터 불러오기 실패 시 무시(앱 크래시 방지)
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [attraction._id]);
  
  // 좋아요 상태 및 수 불러오기
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        // 로그인한 사용자는 좋아요 상태와 수 모두 조회
        if (session?.user) {    
          const res = await axios.get(`/api/attractions/${attraction._id}/likeStatus?userId=${session.user.id}`);
          setLiked(res.data.liked);
          setLikeCount(res.data.count);
        } else {
          // 비로그인 사용자는 좋아요 수만 조회
          const res = await axios.get(`/api/attractions/${attraction._id}/likeStatus`);
          setLikeCount(res.data.count);
        }
      } catch (error) {
        // 좋아요 상태 조회 실패 시 무시
      }
    };
    fetchLikeStatus();
  }, [session, attraction._id]);

  /**
   * 좋아요 버튼 클릭 시 호출되는 함수
   * - 로그인 필요, UI 즉시 반영, 서버에 상태 저장
   */
  const handleLike = async () => {
    if (status !== 'authenticated') {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }
    try {
      setLiked(!liked); // UI 즉시 반영
      const newLikeCount = liked ? likeCount - 1 : likeCount + 1;
      setLikeCount(newLikeCount);
      // 서버에 좋아요 상태 저장
      const response = await axios.post(`/api/attractions/${attraction._id}/like`, { 
        userId: session.user.id,
        liked: !liked 
      });
      setLikeCount(response.data.count); // 서버 응답으로 동기화
    } catch (error) {
      // 오류 발생 시 원래 상태로 복구
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  /**
   * 리뷰 입력값 변경 시 호출되는 함수
   * - 최대 글자 수 제한
   */
  const handleReviewChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_REVIEW_LENGTH) {
      setReview(value);
    }
  };

  /**
   * 리뷰 제출 시 호출되는 함수
   * - 로그인 필요, 서버에 POST 요청, 성공 시 목록 갱신
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;
    if (status !== 'authenticated') {
      alert('리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }
    try {
      setSubmitting(true);
      const response = await axios.post(`/api/attractions/${attraction._id}/review`, {
        userId: session.user.id,
        content: review,
        images: [] // 이미지 업로드 기능이 있다면 추가
      });
      if (response.data.review) {
        setReviews([response.data.review, ...reviews]);
        setReview('');
      }
    } catch (error) {
      alert('리뷰 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.detailContainer} style={isMobile ? { top: headerHeight } : undefined}>
      <div className={styles.navigationButtons}>
        <button className={styles.backButton} onClick={onClose} aria-label="뒤로 가기">
          <FaArrowLeft size={18} />
          <span className={styles.backButtonText}>관광지 목록</span>
        </button>
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <IoClose size={24} />
        </button>
      </div>
      
      <div className={styles.imageContainer}>
        <div className={styles.imageGallery}>
          {attraction.images?.slice(0, visibleImages).map((image, index) => (
            <div key={index} className={styles.imageWrapper}>
              <Image
                src={image}
                alt={`${attraction.name} 이미지 ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={1}
                priority={index < 2}
                loading={index < 2 ? 'eager' : 'lazy'}
                style={{
                  objectFit: 'cover',
                  opacity: loadedImages.has(image) ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
                onLoad={() => handleImageLoad(image)}
              />
              {!loadedImages.has(image) && (
                <div className={styles.skeletonImage} />
              )}
            </div>
          ))}
          {attraction.images?.length > visibleImages && (
            <button onClick={loadMoreImages} className={styles.loadMoreButton}>
              더 보기
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>{attraction.name}</h2>
          <div className={styles.likeContainer}>
            <button 
              className={styles.likeButton} 
              onClick={handleLike}
              aria-label={liked ? '좋아요 취소' : '좋아요'}
              disabled={status === 'loading'}
            >
              {liked ? <FaHeart color="#e74c3c" /> : <FaRegHeart />}
            </button>
            <span className={styles.likeCount}>{likeCount}</span>
          </div>
        </div>
        
        <p className={styles.address}>
          <FaMapMarkerAlt /> {attraction.address}
        </p>
        
        {attraction.description && (
          <p className={styles.description}>{attraction.description}</p>
        )}
        
        <div className={styles.divider}></div>
        
        <h3 className={styles.sectionTitle}>리뷰 작성</h3>
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <textarea
            value={review}
            onChange={handleReviewChange}
            placeholder={status === 'authenticated' ? "리뷰를 작성하세요 (최대 100자)" : "리뷰를 작성하려면 로그인이 필요합니다."}
            className={styles.reviewInput}
            disabled={status !== 'authenticated'}
            maxLength={MAX_REVIEW_LENGTH}
          />
          <div className={styles.reviewCounter}>
            {review.length}/{MAX_REVIEW_LENGTH}자
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting || !review.trim() || status !== 'authenticated'}
          >
            {submitting ? '작성 중...' : '작성'}
          </button>
        </form>
        
        <div className={styles.divider}></div>
        
        <h3 className={styles.sectionTitle}>리뷰 ({reviews.length})</h3>
        {loading ? (
          <p className={styles.loading}>리뷰를 불러오는 중...</p>
        ) : reviews.length === 0 ? (
          <p className={styles.noReviews}>아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
        ) : (
          <div className={styles.reviewsList}>
            {reviews.map((review) => (
              <div key={review._id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{review.user?.nickname || '익명'}</span>
                  </div>
                </div>
                <div className={styles.reviewContent}>
                  <p>{review.content}</p>
                </div>
                {review.images && review.images.length > 0 && (
                  <div className={styles.reviewImages}>
                    {review.images.map((image, index) => (
                      <div key={index} className={styles.reviewImageWrapper}>
                        <Image
                          src={image}
                          alt={`리뷰 이미지 ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={1}
                          loading="lazy"
                          style={{
                            objectFit: 'cover',
                            opacity: loadedImages.has(image) ? 1 : 0,
                            transition: 'opacity 0.3s ease-in-out'
                          }}
                          onLoad={() => handleImageLoad(image)}
                        />
                        {!loadedImages.has(image) && (
                          <div className={styles.skeletonImage} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <span className={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 