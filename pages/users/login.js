import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Login.module.css';
import Header from '../../components/Layout/Header';

/**
 * 로그인 페이지 컴포넌트
 * - 사용자가 이메일/비밀번호로 로그인할 수 있는 폼을 제공
 * @returns JSX.Element - 로그인 UI
 */
export default function Login() {
  const router = useRouter();
  // formData: 입력값 상태(이메일, 비밀번호)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  // errors: 각 입력 필드 및 제출 에러 상태
  const [errors, setErrors] = useState({});
  // isLoading: 로그인 요청 중 여부
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 입력값 변경 핸들러
   * - 입력 필드의 값이 변경될 때 상태를 업데이트
   * @param e - input change 이벤트 객체
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 해당 필드의 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * 입력값 유효성 검사
   * - 이메일/비밀번호 필수 입력 및 이메일 형식 체크
   * @returns boolean - 유효성 통과 여부
   */
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

  /**
   * 로그인 폼 제출 핸들러
   * - 유효성 검사 후 로그인 요청을 수행
   * @param e - form submit 이벤트 객체
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // credentials 방식으로 로그인 요청
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: '/'
      });

      // 로그인 실패 시 에러 메시지 표시
      if (result.error) {
        setErrors({ submit: result.error });
      } else {
        // 로그인 성공 시 홈으로 이동
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
            {/* 이메일 입력 영역 */}
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

            {/* 비밀번호 입력 영역 */}
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

            {/* 로그인 버튼 및 에러 메시지 */}
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