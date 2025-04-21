import { useSession } from 'next-auth/react';
import { useState } from 'react';
import styles from '../../styles/Inquiries.module.css';

export default function InquiryList({ inquiries, onDelete, onAttractionClick }) {
  const { data: session } = useSession();
  const [openId, setOpenId] = useState(null);

  if (!inquiries || inquiries.length === 0) {
    return <p className={styles.emptyText}>등록된 문의가 없습니다.</p>;
  }

  const toggleOpen = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className={styles.inquiryList}>
      {inquiries.map((inquiry) => {
        const isOwner = session?.user?.email === inquiry.email;
        const isSecret = inquiry.isSecret;
        const isTourist = inquiry.targetType === 'tourist';
        const showContent = !isSecret || isOwner || session?.user?.role === 'admin';
        const createdDate = new Date(inquiry.createdAt).toLocaleDateString();
        const isOpen = openId === inquiry._id;

        return (
          <div
            key={inquiry._id}
            className={styles.inquiryCard}
            onClick={() => toggleOpen(inquiry._id)}
          >
            {/* 문의 유형 */}
            <div className={styles.inquiryType}>
              {isTourist ? '📍 관광지 문의' : '📩 일반 문의'}
            </div>

            {/* 이름 + 날짜 */}
            <div className={styles.inquiryHeader}>
              <span className={styles.nickname}>
                {inquiry.nickname} {isSecret && <span className={styles.secretMark}>🔒</span>}
              </span>
              <span className={styles.date}>{createdDate}</span>
            </div>

            {/* 제목 + 관광지명 */}
            <div className={styles.titleRow}>
              <span className={styles.title}>
                {isSecret && !showContent
                  ? '사용자의 요청에 의해 비밀 게시글로 작성되었습니다.'
                  : inquiry.title}
              </span>

              {/* 관광지명 링크 (관광지 문의일 경우만) */}
              {isTourist && inquiry.attractionId && (
                <span
                  className={styles.attractionName}
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 열림 방지
                    onAttractionClick?.(inquiry.attractionId); // 상위에서 전달된 함수 호출
                  }}
                >
                  📍 {inquiry.attractionName}
                </span>
              )}
            </div>

            {/* 내용 (카드 열렸을 때만 표시) */}
            {isOpen && (
              <div className={styles.content}>
                {isSecret && !showContent
                  ? '사용자의 요청에 의해 비밀 게시글로 작성되었습니다.'
                  : inquiry.content}
              </div>
            )}

            {/* 삭제 버튼 (카드 열렸을 때 + 본인일 경우만 노출) */}
            {isOwner && isOpen && (
              <div className={styles.actionRow}>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(inquiry._id);
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}