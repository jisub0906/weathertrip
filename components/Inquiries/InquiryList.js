import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from '../../styles/Inquiries.module.css';
import InquiryForm from './InquiryForm';

export default function InquiryList() {
  const [inquiries, setInquiries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await fetch('/api/inquiries');
        const data = await res.json();
        setInquiries(data.inquiries || []);
      } catch (err) {
        console.error('문의 목록 불러오기 실패:', err);
      }
    };
    fetchInquiries();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const canViewSecret = (inq) => {
    return !inq.isSecret ||
      (session && session.user && (
        session.user.id === inq.userId || session.user.role === 'admin')
      );
  };

  const handleFeedback = async (id, isHelpful) => {
    await fetch(`/api/inquiries/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHelpful })
    });
    alert(isHelpful ? '도움이 되었어요!' : '별로예요.');
  };

  return (
    <div className={styles.listContainer}>
      <h2 className={styles.title}>고객 문의 리스트</h2>

      {/* ✅ 문의 작성 폼을 리스트 상단으로 이동 */}
      <InquiryForm />

      {inquiries.map((inq) => (
        <div key={inq._id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.inquiryType}>● {inq.targetType === 'tourist' ? '관광지 문의' : '일반 문의'}</span>
              {inq.isSecret && <span className={styles.secretTag}>🔒 비밀글</span>}
            </div>
            <div className={styles.date}>{new Date(inq.createdAt).toLocaleDateString()}</div>
          </div>

          <div className={styles.userInfo}><strong>{inq.nickname}</strong></div>

          <div className={styles.titleBox} onClick={() => toggleExpand(inq._id)}>
            {inq.targetType === 'tourist' && inq.attractionName && (
              <div className={styles.attractionInfo}>
                📍 <Link href={`/map?search=${encodeURIComponent(inq.attractionName)}`}>{inq.attractionName}</Link>
              </div>
            )}
            <strong className={styles.titleText}>{inq.title}</strong>
          </div>

          {expandedId === inq._id && (
            <>
              {canViewSecret(inq) ? (
                <>
                  <div className={styles.contentBox}>
                    <p className={styles.contentText}>{inq.content}</p>
                  </div>

                  {inq.answer && (
                    <div className={styles.answerBox}>
                      <strong>답변</strong>
                      <p>{inq.answer}</p>
                      <div className={styles.feedbackRow}>
                        <button onClick={() => handleFeedback(inq._id, true)}>도움이 되었어요</button>
                        <button onClick={() => handleFeedback(inq._id, false)}>별로예요</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.secretBox}>🔒 비밀글입니다. 작성자 또는 관리자만 볼 수 있어요.</div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
