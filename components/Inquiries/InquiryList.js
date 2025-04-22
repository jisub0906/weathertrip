import { useSession } from 'next-auth/react';
import { useState } from 'react';
import styles from '../../styles/Inquiries.module.css';

export default function InquiryList({ inquiries, onDelete, onAttractionClick }) {
  const { data: session } = useSession();
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [followUpTextMap, setFollowUpTextMap] = useState({});
  const [reReplyTextMap, setReReplyTextMap] = useState({});

  if (!inquiries || inquiries.length === 0) {
    return <p className={styles.emptyText}>등록된 문의가 없습니다.</p>;
  }

  const toggleOpen = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const handleReply = async (inquiryId) => {
    if (!replyText.trim()) return alert('답변 내용을 입력해주세요.');
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: replyText })
      });
      const data = await res.json();
      if (res.ok) {
        alert('답변이 등록되었습니다.');
        setReplyText('');
        onDelete('refresh');
      } else alert(data.message || '답변 등록 실패');
    } catch (err) {
      console.error('답변 등록 오류:', err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleAnswerDelete = async (inquiryId, answerId) => {
    if (!confirm('정말 이 답변을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/inquiries/answer-delete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, answerId })
      });
      const data = await res.json();
      if (res.ok) {
        alert('답변이 삭제되었습니다.');
        onDelete('refresh');
      } else alert(data.message || '답변 삭제 실패');
    } catch (err) {
      console.error('삭제 중 오류:', err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleFollowUp = async (inquiryId, answerId, text) => {
    if (!text?.trim()) {
      alert('추가 문의를 입력해주세요.');
      return;
    }

    console.log('📨 handleFollowUp 요청:', { inquiryId, answerId, text });

    try {
      const res = await fetch('/api/inquiries/follow-up', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, answerId, text })
      });

      const data = await res.json();

      if (res.ok) {
        alert('추가 문의가 등록되었습니다.');
        setFollowUpTextMap((prev) => ({ ...prev, [answerId]: '' })); // 개별 텍스트 초기화
        onDelete('refresh'); // 새로고침
      } else {
        alert(data.message || '등록 실패');
      }
    } catch (err) {
      console.error('📛 추가 문의 등록 오류:', err);
      alert('서버 오류가 발생했습니다.');
    }
  };


  const handleReReply = async (inquiryId, answerId, text) => {
    if (!text?.trim()) {
      alert('재답변을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/inquiries/re-reply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          answerId,
          text
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('재답변이 등록되었습니다.');
        setReReplyTextMap((prev) => ({ ...prev, [answerId]: '' }));
        onDelete('refresh');
      } else {
        alert(data.message || '등록 실패');
      }
    } catch (err) {
      console.error('재답변 등록 오류:', err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDeleteFollowUp = async (inquiryId, answerId) => {
    if (!confirm('추가 문의를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch('/api/inquiries/follow-up-delete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, answerId })
      });

      const data = await res.json();

      if (res.ok) {
        alert('추가 문의가 삭제되었습니다.');
        onDelete('refresh');
      } else {
        alert(data.message || '삭제 실패');
      }
    } catch (err) {
      console.error('추가 문의 삭제 오류:', err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.inquiryList}>
      {inquiries.map((inquiry) => {
        const isOwner = session?.user?.email === inquiry.email;
        const isAdmin = session?.user?.role === 'admin';
        const showContent = !inquiry.isSecret || isOwner || isAdmin;
        const isOpen = openId === inquiry._id;
        return (
          <div
            key={inquiry._id}
            className={`${styles.inquiryCard} ${inquiry.isSecret && !showContent ? styles.disabledCard : ''}`}
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
              <span className={styles.nickname}>
                {inquiry.nickname} {inquiry.isSecret && <span className={styles.secretMark}>🔒</span>}
              </span>
              <span className={styles.date}>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
            </div>

            <div className={styles.titleRow}>
              <span className={styles.title}>
                {inquiry.isSecret && !showContent
                  ? '🔒 사용자의 요청에 의해 비밀 게시글로 작성되었습니다. 🔒'
                  : inquiry.title}
              </span>
              {inquiry.status === 'answered' && <span className={styles.badgeAnswered}>✅ 답변 완료</span>}
              {inquiry.status === 'pending' && <span className={styles.badgePending}>⏳ 답변 대기</span>}
            </div>

            {isOpen && (
              <>
                <div className={styles.content}>{inquiry.content}</div>
                {inquiry.answers?.map((ans, index) => (
                  <div key={ans._id || index} className={styles.answerBox}>
                    <div className={styles.answerLabel}>💬 관리자 답변</div>
                    <div className={styles.answerContent}>
                      {ans.isDeleted ? (
                        <span className={styles.deletedAnswer}>🗑 삭제된 답변입니다.</span>
                      ) : (
                        <>{ans.text}</>
                      )}
                    </div>
                    {isAdmin && !ans.isDeleted && (
                      <div className={styles.buttonRowRight}>
                        <button
                          className={styles.grayButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnswerDelete(inquiry._id, ans._id);
                          }}
                        >
                          답변 삭제
                        </button>
                      </div>
                    )}

                    {!ans.isDeleted && !ans.followUp?.question && !isAdmin && (
                      <div className={styles.answerBox}>
                        <textarea
                          className={styles.textarea}
                          placeholder="추가 문의를 입력하세요"
                          value={followUpTextMap[ans._id] || ''}
                          onChange={(e) =>
                            setFollowUpTextMap((prev) => ({
                              ...prev,
                              [ans._id]: e.target.value
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className={styles.buttonRow}>
                          <button
                            className={styles.submitButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowUp(
                                inquiry._id,
                                ans._id.toString(),
                                followUpTextMap[ans._id]
                              );
                            }}
                          >
                            추가 문의 등록
                          </button>
                        </div>
                      </div>
                    )}

                    {ans.followUp?.question && (
                      <div className={`${styles.answerBox} ${styles.userQuestion}`}>
                        <div className={styles.answerLabel}>🙋 사용자 추가 문의</div>
                        <div className={styles.answerContent}>
                          {ans.followUp.question.isDeleted
                            ? <span className={styles.deletedAnswer}>🗑 삭제된 추가 문의입니다.</span>
                            : ans.followUp.question.text}
                        </div>

                        {/* 🔘 삭제 버튼 (작성자 or 관리자만) */}
                        {!ans.followUp.question.isDeleted && (isOwner || isAdmin) && (
                          <div className={styles.buttonRowRight}>
                            <button
                              className={styles.grayButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFollowUp(inquiry._id, ans._id.toString());
                              }}
                            >
                              추가 문의 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isAdmin && ans.followUp?.question && !ans.followUp?.reReply && (
                      <div className={styles.answerBox}>
                        <textarea
                          className={styles.textarea}
                          placeholder="재답변을 입력하세요"
                          value={reReplyTextMap[ans._id] || ''}
                          onChange={(e) =>
                            setReReplyTextMap((prev) => ({
                              ...prev,
                              [ans._id]: e.target.value
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={styles.buttonRow}>
                          <button
                            className={styles.submitButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReReply(inquiry._id, ans._id, reReplyTextMap[ans._id]);
                            }}
                          >
                            재답변 등록
                          </button>
                        </div>
                      </div>
                    )}

                    {ans.followUp?.reReply && (
                      <div className={styles.answerBox}>
                        <div className={styles.answerLabel}>💬 관리자 재답변</div>
                        <div className={styles.answerContent}>{ans.followUp.reReply.text}</div>
                      </div>
                    )}
                  </div>
                ))}

                {isAdmin && (
                  <div className={styles.answerBox} onClick={(e) => e.stopPropagation()}>
                    <textarea
                      className={styles.textarea}
                      placeholder="답변을 입력하세요"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.submitButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(inquiry._id);
                        }}
                      >
                        답변 등록
                      </button>
                    </div>
                  </div>
                )}

                {(isOwner || isAdmin) && (
                  <div className={styles.buttonRowRight}>
                    <button
                      className={styles.grayButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(inquiry._id);
                      }}
                    >
                      문의 삭제
                    </button>
                  </div>
                )}
              </>
            )
            }
          </div>
        );
      })}
    </div >
  );
}
