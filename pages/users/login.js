import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Login.module.css';
import Header from '../../components/Layout/Header';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/');
            }
        } catch (error) {
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className={styles.container}>
                <div className={styles.loginBox}>
                    <h1>로그인</h1>
                    {error && <div className={styles.error}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">이메일</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                    <div className={styles.links}>
                        <Link href="/users/register">회원가입</Link>
                        <Link href="/users/find-password">비밀번호 찾기</Link>
                    </div>
                </div>
            </div>
        </>
    );
}