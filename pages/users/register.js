import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Register.module.css';
import Header from '../../components/Layout/Header';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // ✅ 추가
    nickname: '',
    gender: '',
    birthdate: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = '비밀번호는 소문자를 포함해야 합니다';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = '비밀번호는 대문자를 포함해야 합니다';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = '비밀번호는 숫자를 포함해야 합니다';
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = '비밀번호는 특수문자(!@#$%^&*)를 포함해야 합니다';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (/^\d/.test(formData.nickname)) {
      newErrors.nickname = '닉네임은 숫자로 시작할 수 없습니다';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!/^(010|011|016|017|018|019)-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // ✅ confirmPassword 포함
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '회원가입 중 오류가 발생했습니다.');
      }

      router.push('/users/login?registered=true');
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.registerBox}>
          <h1 className={styles.title}>회원가입</h1>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className={styles.errorText}>{errors.name}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.input}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>

            {/* ✅ 비밀번호 확인 입력칸 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={styles.input}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nickname">닉네임</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                className={styles.input}
                value={formData.nickname}
                onChange={handleChange}
              />
              {errors.nickname && <p className={styles.errorText}>{errors.nickname}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>성별</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="남성"
                    checked={formData.gender === '남성'}
                    onChange={handleChange}
                    className={styles.radio}
                  />
                  남성
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="여성"
                    checked={formData.gender === '여성'}
                    onChange={handleChange}
                    className={styles.radio}
                  />
                  여성
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="birthdate">생년월일</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                className={styles.datePicker}
                value={formData.birthdate}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="phone">전화번호</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className={styles.input}
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
              />
              {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? '처리중...' : '회원가입'}
            </button>

            {errors.submit && <p className={styles.errorText}>{errors.submit}</p>}
          </form>

          <div className={styles.linkContainer}>
            <Link href="/users/login" className={styles.link}>
              로그인
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