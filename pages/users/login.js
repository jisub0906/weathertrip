import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!email.trim()) {
            newErrors.email = '이메일을 입력해주세요';
        }
        
        if (!password) {
            newErrors.password = '비밀번호를 입력해주세요';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                alert('로그인 성공!');
                router.push('/');
            } else {
                if (data.error === 'user_not_found' || data.error === 'password_mismatch') {
                    setErrors({ auth: '이메일 또는 비밀번호가 틀렸습니다' });
                } else {
                    alert(data.message || '로그인 실패');
                }
            }
        } catch (error) {
            console.error('로그인 요청 에러:', error);
            alert('❌ 서버 오류가 발생했습니다.');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '450px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>로그인</h1>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>이메일</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="이메일 주소 입력"
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: errors.email ? '1px solid red' : '1px solid #ccc',
                            borderRadius: '4px' 
                        }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="비밀번호 입력"
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: errors.password ? '1px solid red' : '1px solid #ccc',
                            borderRadius: '4px' 
                        }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && <small style={{ color: 'red' }}>{errors.password}</small>}
                </div>

                {errors.auth && (
                    <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#ffeeee', 
                        border: '1px solid #ffcccc',
                        borderRadius: '4px',
                        marginBottom: '1.5rem',
                        color: 'red'
                    }}>
                        {errors.auth}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button 
                        type="submit"
                        style={{
                            backgroundColor: '#4361ee',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        로그인
                    </button>
                    <button
                        type="button"
                        style={{
                            backgroundColor: '#f0f0f0',
                            color: '#333',
                            padding: '0.75rem 1.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                        onClick={() => {
                            const confirmLeave = window.confirm(
                                '이 페이지에서 벗어나시겠습니까? 현재 입력된 정보값들이 초기화 됩니다.'
                            );
                            if (confirmLeave) window.location.href = '/';
                        }}
                    >
                        돌아가기
                    </button>
                </div>
            </form>
        </div>
    );
}