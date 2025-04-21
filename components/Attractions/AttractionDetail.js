import { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import styles from '../../styles/AttractionDetail.module.css';
import axios from 'axios';
import { useSession } from 'next-auth/react';

// 관광지 상세 정보 컴포넌트
// props: attraction (관광지 정보), onClose (닫기 함수)
export default function AttractionDetail({ attraction, onClose }) {
  const { data: session, status } = useSession(); // 로그인 상태 확인
  const [liked, setLiked] = useState(false); // 좋아여 여부
  const [review, setReview] = useState(''); // 입력 중인 리뷰
  const [reviews, setReviews] = useState([]); // 관광지에 달린 리뷰 목록
  const [submitting, setSubmitting] = useState(false); // 리뷰 작성 여부
  const [likeCount, setLikeCount] = useState(attraction.likeCount || 0); // 좋아요 수
  const [loading, setLoading] = useState(true); // 리뷰 로딩 여부
  const MAX_REVIEW_LENGTH = 100; // 리뷰 최대 길이

  // 이미지 배열이 없거나 비어있는 경우 기본 이미지 사용
  const images = attraction.images && attraction.images.length > 0
    ? attraction.images
    : ['/next.svg'];

  // 컴포넌트가 마운트될 때 리뷰 데이터 불러오기
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // 리뷰 데이터 API 호출
        const response = await axios.get(`/api/attractions/${attraction._id}/review`);
        // 응답에 리뷰가 있다면 reviews 상태에 저장해서 화면에 표시되게 합니다.
        if (response.data.reviews) {
          setReviews(response.data.reviews);
        }
        // 오류가 발생해도 앱이 꺼지지 않도록 try-catch로 감싸고, 마지막에 로딩 상태를 끕니다.
      } catch (error) {
        console.error('리뷰 데이터 불러오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [attraction._id]);
  
  // 좋아요 데이터 불러오기
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        // 로그인한 사용자의 경우 좋아요 상태도 함께 조회
        if (session?.user) {
          const res = await axios.get(`/api/attractions/${attraction._id}/likeStatus?userId=${session.user.id}`);
          setLiked(res.data.liked);
          setLikeCount(res.data.count);
        } else {
          // 로그인하지 않은 사용자의 경우 좋아요 수만 조회
          const res = await axios.get(`/api/attractions/${attraction._id}/likeStatus`);
          setLikeCount(res.data.count);
        }
      } catch (error) {
        console.error('좋아요 상태 조회 오류:', error);
      }
    };

    fetchLikeStatus();
  }, [session, attraction._id]);

  // 좋아요 버튼 클릭 처리
  const handleLike = async () => {
    if (status !== 'authenticated') {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }
  
    try {
      setLiked(!liked);
      // 좋아요 상태 업데이트 (UI 즉시 반영)
      const newLikeCount = liked ? likeCount - 1 : likeCount + 1;
      setLikeCount(newLikeCount);
      
      // API 호출 : 좋아요 상태를 서버에 저장합니다.
      const response = await axios.post(`/api/attractions/${attraction._id}/like`, { 
        userId: session.user.id,
        liked: !liked 
      });
      setLikeCount(response.data.count); // 서버에서 받은 좋아요 수로 업데이트
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      // 오류 발생 시 원래 상태로 복구
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  // 리뷰 입력 처리
  const handleReviewChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_REVIEW_LENGTH) {
      setReview(value);
    }
  };

  // 리뷰 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;

    if (status !== 'authenticated') {
      alert('리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }
    // 서버에 리뷰 데이터를 POST 요청으로 보냅니다
    try {
      setSubmitting(true); // 로딩 상태 시작
      const response = await axios.post(`/api/attractions/${attraction._id}/review`, {
        userId: session.user.id,
        content: review,
        images: [] // 이미지 업로드 기능이 있다면 추가
      });
      // 서버에서 성공적으로 리뷰를 작성한 경우 리뷰 목록에 추가 후 입력창 초기화
      if (response.data.review) {
        setReviews([response.data.review, ...reviews]);
        setReview('');
      }
      // 실패 시 경고 메시지 출력
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      alert('리뷰 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false); // 로딩 상태 종료
    }
  };

  return (
    <div className={styles.detailContainer}>
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
        <img 
          src={images[0]} 
          alt={attraction.name} 
          className={styles.mainImage}
        />
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
                    <span className={styles.userName}>{review.user?.name || '익명'}</span>
                  </div>
                </div>
                <div className={styles.reviewContent}>
                  <p>{review.content}</p>
                </div>
                {review.images && review.images.length > 0 && (
                  <div className={styles.reviewImages}>
                    {review.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`리뷰 이미지 ${index + 1}`}
                        className={styles.reviewImage}
                      />
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