import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Pagination from '../Page/Pagination'; // ✅ 추가
import styles from '../../styles/Inquiries.module.css';

export default function InquiryList({ inquiries, onDelete, onAttractionClick, onFilter }) {
  const { data: session } = useSession();
  const [openId, setOpenId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(inquiries.length / itemsPerPage);

  const toggleOpen = (id) => setOpenId((prev) => (prev === id ? null : id));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInquiries = inquiries.slice(startIndex, startIndex + itemsPerPage);

  const safeRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onDelete('refresh');
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <div className={styles.inquiryList}>
      {currentInquiries.map((inquiry) => {
        const isOwner = session?.user?.email === inquiry.email;
        const isAdmin = session?.user?.role === 'admin';
        const isOpen = openId === inquiry._id;
        const hasVisibleAnswer = inquiry.answers?.some((ans) => !ans.isDeleted);
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
                <div className={styles.content}>{inquiry.content}</div>

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

      {/* ✅ 페이징 하단 추가 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}