import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Mypage.module.css';
import { signOut } from 'next-auth/react';
import Header from '../../components/Layout/Header';

export default function MyPage() {
    const [user, setUser] = useState(null);
    const [editData, setEditData] = useState({ password: '', confirmPassword: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [withdrawData, setWithdrawData] = useState({ email: '', password: '' });
    const withdrawRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/users/mypage');
                const data = await res.json();
                setUser(data);
                setEditData({ ...data, password: '', confirmPassword: '' });
            } catch (err) {
                console.error(err);
                router.push('/users/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (isDeleting && withdrawRef.current) {
            setTimeout(() => {
                withdrawRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [isDeleting]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (editData.password !== editData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const res = await fetch('/api/users/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });

            const result = await res.json();
            if (!res.ok) {
                alert(result.message || '수정 중 오류가 발생했습니다.');
                return;
            }

            setUser(result);
            setIsEditing(false);
            alert('수정이 완료되었습니다.');
        } catch (err) {
            console.error(err);
            alert('서버 오류가 발생했습니다.');
        }
    };

    const handleWithdraw = async () => {
        try {
            const res = await fetch('/api/users/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(withdrawData),
            });

            const result = await res.json();
            if (!res.ok) {
                alert(result.message || '탈퇴에 실패했습니다.');
                return;
            }

            alert('회원 탈퇴가 완료되었습니다.');
            await signOut({ callbackUrl: '/' });
        } catch (err) {
            console.error(err);
            alert('서버 오류가 발생했습니다.');
        }
    };

    if (loading) return <p>불러오는 중...</p>;

    return (
        <>
            <Header />
            <div className={styles.container}>
                <div className={styles.mypageBox}>
                    <h1 className={styles.title}>회원정보</h1>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="name">이름</label>
                            <input type="text" id="name" name="name" className={styles.input} value={editData.name || ''} disabled />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">이메일</label>
                            <input type="email" id="email" name="email" className={styles.input} value={editData.email || ''} disabled />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">비밀번호</label>
                            <input type="password" id="password" name="password" className={styles.input} value={editData.password} onChange={handleChange} disabled={!isEditing} />
                        </div>
                        {isEditing && (
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="confirmPassword">비밀번호 확인</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" className={styles.input} value={editData.confirmPassword} onChange={handleChange} />
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="nickname">닉네임</label>
                            <input type="text" id="nickname" name="nickname" className={styles.input} value={editData.nickname || ''} onChange={handleChange} disabled={!isEditing} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>성별</label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radioLabel}>
                                    <input type="radio" name="gender" value="남성" checked={editData.gender === '남성'} onChange={handleChange} disabled={!isEditing} /> 남성
                                </label>
                                <label className={styles.radioLabel}>
                                    <input type="radio" name="gender" value="여성" checked={editData.gender === '여성'} onChange={handleChange} disabled={!isEditing} /> 여성
                                </label>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="birthdate">생년월일</label>
                            <input type="date" id="birthdate" name="birthdate" className={styles.input} value={editData.birthdate || ''} onChange={handleChange} disabled={!isEditing} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="phone">전화번호</label>
                            <input type="text" id="phone" name="phone" className={styles.input} value={editData.phone || ''} disabled />
                        </div>
                        <div className={styles.buttonGroup}>
                            {isEditing ? (
                                <>
                                    <button type="button" className={styles.editBtn} onClick={handleSave}>저장</button>
                                    <button type="button" className={styles.deleteBtn} onClick={() => setIsEditing(false)}>취소</button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className={styles.editBtn} onClick={() => setIsEditing(true)}>정보 수정</button>
                                    <button type="button" className={styles.deleteBtn} onClick={() => setIsDeleting(true)}>회원 탈퇴</button>
                                </>
                            )}
                        </div>
                        {isDeleting && (
                            <div className={styles.withdrawBox} ref={withdrawRef}>
                                <h3 className={styles.withdrawTitle}>정말 탈퇴하시겠습니까?</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} htmlFor="deleteEmail">이메일</label>
                                    <input type="email" id="deleteEmail" className={styles.input} value={withdrawData.email} onChange={(e) => setWithdrawData((prev) => ({ ...prev, email: e.target.value }))} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} htmlFor="deletePassword">비밀번호</label>
                                    <input type="password" id="deletePassword" className={styles.input} value={withdrawData.password} onChange={(e) => setWithdrawData((prev) => ({ ...prev, password: e.target.value }))} />
                                </div>
                                <div className={styles.buttonGroup}>
                                    <button type="button" className={styles.deleteBtn} onClick={handleWithdraw}>탈퇴</button>
                                    <button type="button" className={styles.editBtn} onClick={() => setIsDeleting(false)}>취소</button>
                                </div>
                            </div>
                        )}
                    </form>
                    <Link href="/" className={styles.link}>홈으로</Link>
                </div>
            </div>
        </>
    );
}