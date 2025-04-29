import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Login.module.css';
import Header from '../../components/Layout/Header';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 입력값 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 로그인 요청
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: '/'
      });

      if (result.error) {
        setErrors({ submit: result.error });
      } else {
        router.push(result.url || '/');
      }
    } catch (error) {
      setErrors({ submit: '로그인 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>로그인</h1>

          <form onSubmit={handleSubmit}>
            {/* 이메일 입력 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>

            {/* 비밀번호 입력 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.input}
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            {errors.submit && <p className={styles.errorText}>{errors.submit}</p>}
          </form>

          {/* 회원가입, 홈으로 이동 링크 */}
          <div className={styles.linkContainer}>
            <Link href="/users/register" className={styles.link}>
              회원가입
            </Link>
            <Link href="/" className={styles.link}>
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}