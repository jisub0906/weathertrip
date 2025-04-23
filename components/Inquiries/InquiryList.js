import { useSession } from 'next-auth/react';
import { useState } from 'react';
import styles from '../../styles/Inquiries.module.css';

export default function InquiryList({ inquiries, onDelete, onAttractionClick }) {
  const { data: session } = useSession();
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [followUpTextMap, setFollowUpTextMap] = useState({});
  const [reReplyTextMap, setReReplyTextMap] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleOpen = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const safeRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onDelete('refresh');
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <div className={styles.inquiryList}>
      {inquiries.map((inquiry) => {
        const isOwner = session?.user?.email === inquiry.email;
        const isAdmin = session?.user?.role === 'admin';
        const isOpen = openId === inquiry._id;

        return (
          <div key={inquiry._id} className={styles.inquiryCard} onClick={() => toggleOpen(inquiry._id)}>
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
              <span className={styles.nickname}>{inquiry.nickname}</span>
              <span className={styles.date}>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
            </div>

            <div className={styles.titleRow}>
              <span className={styles.title}>{inquiry.title}</span>
              {inquiry.status === 'answered' && <span className={styles.badgeAnswered}>✅ 답변 완료</span>}
              {inquiry.status === 'pending' && <span className={styles.badgePending}>⏳ 답변 대기</span>}
            </div>

            {isOpen && (
              <>
                <div className={styles.content}>{inquiry.content}</div>

                {inquiry.answers?.map((ans, index) => {
                  const followUps = ans.followUp?.followUps || [];
                  const reReplies = ans.followUp?.reReplies || [];
                  const hasUndeletedFollowUps = followUps.some(f => !f.isDeleted);
                  const hasUndeletedReReplies = reReplies.some(r => !r.isDeleted);

                  return (
                    <div key={ans._id || index} className={styles.answerBox}>
                      <div className={styles.answerLabel}>💬 관리자 답변</div>
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
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    inquiryId: inquiry._id,
                                    answerId: ans._id
                                  })
                                }).then(() => safeRefresh());
                              }
                            }}
                          >
                            답변 삭제
                          </button>
                        </div>
                      )}

                      {/* ✅ followUps 먼저 렌더링 */}
                      {followUps.map((item, idx) => (
                        <div key={idx} className={`${styles.answerBox} ${styles['level-2']}`}>
                          <div className={styles.answerLabel}>🙋 사용자 추가 문의</div>
                          <div className={styles.answerContent}>
                            {item.isDeleted ? '🗑 삭제된 추가 문의입니다.' : item.text}
                          </div>
                          {(isAdmin || item.email === session?.user?.email) && !item.isDeleted && (
                            <div className={styles.buttonRowRight}>
                              <button
                                className={styles.grayButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('추가 문의를 삭제하시겠습니까?')) {
                                    fetch('/api/inquiries/follow-up-delete', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ inquiryId: inquiry._id, answerId: ans._id })
                                    }).then(() => safeRefresh());
                                  }
                                }}
                              >
                                추가 문의 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* ✅ followUps가 모두 삭제된 경우에만 입력창 노출 */}
                      {!hasUndeletedFollowUps && isOwner && (
                        <div className={`${styles.answerBox} ${styles['level-2']}`}>
                          <textarea
                            className={styles.textarea}
                            placeholder="추가 문의를 입력하세요"
                            value={followUpTextMap[ans._id] || ''}
                            onChange={(e) =>
                              setFollowUpTextMap((prev) => ({ ...prev, [ans._id]: e.target.value }))
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className={styles.buttonRow}>
                            <button
                              className={styles.submitButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetch('/api/inquiries/follow-up', {
                                  method: 'PATCH,
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    inquiryId: inquiry._id,
                                    answerId: ans._id,
                                    text: followUpTextMap[ans._id]
                                  })
                                }).then(() => safeRefresh());
                              }}
                            >
                              추가 문의 등록
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ✅ followUps 아래에 reReplies 순차 렌더링 */}
                      {reReplies.map((reply, idx) => (
                        <div key={idx} className={`${styles.answerBox} ${styles['level-3']}`}>
                          <div className={styles.answerLabel}>💬 관리자 재답변</div>
                          <div className={styles.answerContent}>
                            {reply.isDeleted ? '🗑 삭제된 재답변입니다.' : reply.text}
                          </div>
                          {isAdmin && !reply.isDeleted && (
                            <div className={styles.buttonRowRight}>
                              <button
                                className={styles.grayButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('재답변을 삭제하시겠습니까?')) {
                                    fetch('/api/inquiries/re-reply-delete', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ inquiryId: inquiry._id, answerId: ans._id })
                                    }).then(() => safeRefresh());
                                  }
                                }}
                              >
                                재답변 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* ✅ 재답변이 모두 삭제된 경우에만 입력창 표시 */}
                      {!hasUndeletedReReplies && isAdmin && followUps.length > 0 && (
                        <div className={`${styles.answerBox} ${styles['level-3']}`}>
                          <textarea
                            className={styles.textarea}
                            placeholder="재답변을 입력하세요"
                            value={reReplyTextMap[ans._id] || ''}
                            onChange={(e) =>
                              setReReplyTextMap((prev) => ({ ...prev, [ans._id]: e.target.value }))
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className={styles.buttonRow}>
                            <button
                              className={styles.submitButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetch('/api/inquiries/re-reply', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    inquiryId: inquiry._id,
                                    answerId: ans._id,
                                    text: reReplyTextMap[ans._id]
                                  })
                                }).then(() => safeRefresh());
                              }}
                            >
                              재답변 등록
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
