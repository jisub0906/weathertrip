import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Pagination from '../Page/Pagination';
import styles from '../../styles/Inquiries.module.css';

/**
 * 문의 목록을 카드 형태로 보여주고, 답변/삭제/필터 등 관리 기능을 제공하는 컴포넌트
 * @param inquiries - 문의 데이터 배열
 * @param onDelete - 삭제/새로고침 콜백
 * @param onAttractionClick - 관광지명 클릭 시 콜백
 * @param onFilter - 필터 적용 콜백
 * @returns 문의 리스트 UI
 */
export default function InquiryList({ inquiries, onDelete, onAttractionClick, onFilter }) {
  // 현재 로그인 세션 정보
  const { data: session } = useSession();
  // 펼쳐진(상세보기) 문의 ID
  const [openId, setOpenId] = useState(null);
  // 새로고침 중 여부
  const [isRefreshing, setIsRefreshing] = useState(false);
  // 답변 입력 상태 (문의별)
  const [replyText, setReplyText] = useState({});
  // 현재 페이지 번호
  const [currentPage, setCurrentPage] = useState(1);
  // 한 페이지당 문의 개수
  const itemsPerPage = 5;
  // 전체 페이지 수
  const totalPages = Math.ceil(inquiries.length / itemsPerPage);

  /**
   * 문의 카드 클릭 시 상세 열기/닫기 토글
   */
  const toggleOpen = (id) => setOpenId((prev) => (prev === id ? null : id));

  // 현재 페이지에 보여줄 문의 데이터 슬라이스
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInquiries = inquiries.slice(startIndex, startIndex + itemsPerPage);

  /**
   * 답변 삭제/등록 후 새로고침(중복 방지)
   */
  const safeRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onDelete('refresh');
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <div className={styles.inquiryList}>
      {currentInquiries.map((inquiry) => {
        // 문의 작성자/관리자 여부
        const isOwner = session?.user?.email === inquiry.email;
        const isAdmin = session?.user?.role === 'admin';
        // 현재 카드가 열려있는지 여부
        const isOpen = openId === inquiry._id;
        // 삭제되지 않은 답변 존재 여부
        const hasVisibleAnswer = inquiry.answers?.some((ans) => !ans.isDeleted);
        // 닉네임 표시
        const displayName = inquiry.nickname;

        return (
          <div
            key={inquiry._id}
            className={styles.inquiryCard}
            onClick={() => toggleOpen(inquiry._id)}
          >
            <div className={styles.inquiryType}>
              <span className={styles.inquiryTypeIcon}>
                {inquiry.targetType === 'tourist' ? '📍 관광지 문의' : '📩 일반 문의'}
              </span>
              {inquiry.attractionId && (
                <span
                  className={styles.attractionName}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAttractionClick?.(inquiry.attractionId);
                  }}
                >
                  | {inquiry.attractionName}
                </span>
              )}
            </div>

            <div className={styles.inquiryHeader}>
              <span
                className={styles.nickname}
                onClick={(e) => {
                  e.stopPropagation();
                  onFilter?.({ email: inquiry.email });
                }}
                style={{ cursor: 'pointer' }}
              >
                {displayName}
              </span>
              <span className={styles.date}>
                {new Date(inquiry.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className={styles.titleRow}>
              <span className={styles.title}>{inquiry.title}</span>
              {inquiry.status === 'answered' && (
                <span className={styles.badgeAnswered}>✅ 답변 완료</span>
              )}
              {inquiry.status === 'pending' && (
                <span className={styles.badgePending}>⏳ 답변 대기</span>
              )}
            </div>

            {isOpen && (
              <>
                {/* 문의 상세 내용 */}
                <div className={styles.content}>{inquiry.content}</div>

                {/* 답변 목록 렌더링 */}
                {inquiry.answers?.map((ans) => (
                  <div key={ans._id} className={styles.answerBox}>
                    <div className={styles.answerLabelRow}>
                      <span className={styles.answerLabel}>💬 관리자 답변</span>
                      <span className={styles.date}>
                        {new Date(ans.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className={styles.answerContent}>
                      {ans.isDeleted ? (
                        <span className={styles.deletedAnswer}>🗑 삭제된 답변입니다.</span>
                      ) : (
                        ans.text
                      )}
                    </div>

                    {/* 관리자만 답변 삭제 가능 */}
                    {isAdmin && !ans.isDeleted && (
                      <div className={styles.buttonRowRight}>
                        <button
                          className={styles.grayButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('답변을 삭제하시겠습니까?')) {
                              fetch('/api/inquiries/answer-delete', {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  inquiryId: inquiry._id,
                                  answerId: ans._id,
                                }),
                              }).then(() => safeRefresh());
                            }
                          }}
                        >
                          답변 삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* 답변이 없고, 관리자만 답변 등록 가능 */}
                {isAdmin && !hasVisibleAnswer && (
                  <div className={styles.answerBox}>
                    <textarea
                      className={styles.textarea}
                      placeholder="답변을 입력하세요"
                      value={replyText[inquiry._id] || ''}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [inquiry._id]: e.target.value }))
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.submitButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetch('/api/inquiries/answer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              inquiryId: inquiry._id,
                              answer: replyText[inquiry._id] || '',
                            }),
                          }).then(() => {
                            setReplyText((prev) => ({ ...prev, [inquiry._id]: '' }));
                            safeRefresh();
                          });
                        }}
                      >
                        답변 등록
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* 페이지네이션 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}