import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Layout/Header';

const genderOptions = [
  { label: '남성', value: 'male' },
  { label: '여성', value: 'female' }
];

const countries = ['대한민국', '미국', '일본', '영국'];

const cities = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주도'
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nickname: '',
    gender: '',
    birthdate: '',
    phone1: '010',
    phone2: '',
    phone3: '',
    region: {
      country: '',
      city: ''
    }
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // 필수 항목 검증
    if (!formData.name?.trim()) newErrors.name = '이름을 입력해주세요';
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '유효하지 않은 이메일 형식입니다';
    }
    
    // 비밀번호 길이 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 4) {
      newErrors.password = '비밀번호는 최소 4자리 이상이어야 합니다';
    }
    
    // 닉네임 검증
    if (!formData.nickname?.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (/^\d/.test(formData.nickname)) {
      newErrors.nickname = '닉네임은 숫자로 시작할 수 없습니다';
    }
    
    // 전화번호 검증
    if (!formData.phone2?.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (formData.phone2.length !== 4 || !/^\d+$/.test(formData.phone2)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다';
    }
    
    if (!formData.phone3?.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (formData.phone3.length !== 4 || !/^\d+$/.test(formData.phone3)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const { name, email, password, nickname, phone1, phone2, phone3, gender, birthdate, region } = formData;
    const fullPhone = `${phone1}-${phone2}-${phone3}`;

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          nickname: nickname.trim(),
          gender: gender || undefined,
          birthdate: birthdate || undefined,
          phone: fullPhone,
          region: region?.country ? {
            country: region.country,
            city: region.city || undefined
          } : undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('🎉 회원가입이 완료되었습니다!');
        window.location.href = '/';
      } else {
        // 서버 검증 오류 처리
        if (data.message) {
          if (data.message.includes('이메일')) {
            setErrors({ ...errors, email: data.message });
          } else if (data.message.includes('비밀번호')) {
            setErrors({ ...errors, password: data.message });
          } else if (data.message.includes('닉네임')) {
            setErrors({ ...errors, nickname: data.message });
          } else if (data.message.includes('전화번호')) {
            setErrors({ ...errors, phone: data.message });
          } else {
            alert(`❗ 가입 실패: ${data.message}`);
          }
        } else {
          alert('❗ 가입 실패: 알 수 없는 오류가 발생했습니다');
        }
      }
    } catch (error) {
      console.error('가입 요청 에러:', error);
      alert('❌ 서버 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '450px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>회원가입</h1>
        <form>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>* 이름</label>
            <input
              id="name"
              type="text"
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: errors.name ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <small style={{ color: 'red' }}>{errors.name}</small>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>* 이메일</label>
            <input
              id="email"
              type="email"
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: errors.email ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>* 비밀번호</label>
            <input
              id="password"
              type="password"
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: errors.password ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password ? (
              <small style={{ color: 'red' }}>{errors.password}</small>
            ) : (
              <small style={{ color: 'gray' }}>비밀번호는 최소 4자 이상이어야 합니다.</small>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="nickname" style={{ display: 'block', marginBottom: '0.5rem' }}>* 닉네임</label>
            <input
              id="nickname"
              type="text"
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: errors.nickname ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
              value={formData.nickname}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })}
            />
            {errors.nickname && <small style={{ color: 'red' }}>{errors.nickname}</small>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>성별</label>
            <div>
              {genderOptions.map((option) => (
                <label key={option.value} htmlFor={option.value} style={{ marginRight: '1rem' }}>
                  <input
                    type="radio"
                    id={option.value}
                    name="gender"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="birthdate" style={{ display: 'block', marginBottom: '0.5rem' }}>생년월일</label>
            <input
              id="birthdate"
              type="date"
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              value={formData.birthdate}
              onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>* 전화번호</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                style={{ 
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                value={formData.phone1}
                onChange={e => setFormData({ ...formData, phone1: e.target.value })}
              >
                <option value="010">010</option>
                <option value="011">011</option>
                <option value="016">016</option>
                <option value="017">017</option>
                <option value="018">018</option>
                <option value="019">019</option>
              </select>

              <input
                type="text"
                maxLength="4"
                placeholder="1234"
                style={{ 
                  flex: 1,
                  padding: '0.5rem',
                  border: errors.phone ? '1px solid red' : '1px solid #ccc',
                  borderRadius: '4px'
                }}
                value={formData.phone2}
                onChange={e => setFormData({ ...formData, phone2: e.target.value.replace(/\D/g, '') })}
              />

              <input
                type="text"
                maxLength="4"
                placeholder="5678"
                style={{ 
                  flex: 1,
                  padding: '0.5rem',
                  border: errors.phone ? '1px solid red' : '1px solid #ccc',
                  borderRadius: '4px'
                }}
                value={formData.phone3}
                onChange={e => setFormData({ ...formData, phone3: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            {errors.phone && <small style={{ color: 'red' }}>{errors.phone}</small>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="country" style={{ display: 'block', marginBottom: '0.5rem' }}>국가</label>
            <select
              id="country"
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              value={formData.region.country}
              onChange={e => setFormData({
                ...formData,
                region: {
                  ...formData.region,
                  country: e.target.value,
                  city: ''
                }
              })}
            >
              <option value="">국가 선택</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="city" style={{ display: 'block', marginBottom: '0.5rem' }}>도시</label>
            <select
              id="city"
              disabled={formData.region.country !== '대한민국'}
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: formData.region.country !== '대한민국' ? '#f0f0f0' : 'white'
              }}
              value={formData.region.city}
              onChange={e => setFormData({
                ...formData,
                region: {
                  ...formData.region,
                  city: e.target.value
                }
              })}
            >
              <option value="">도시 선택</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              onClick={handleSubmit}
            >
              가입하기
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
                const confirmLeave = window.confirm('이 페이지에서 벗어나시겠습니까? 현재 입력된 정보값들이 초기화 됩니다.');
                if (confirmLeave) window.location.href = '/';
              }}
            >
              돌아가기
            </button>
          </div>

          <p style={{ marginTop: '1.5rem', color: 'gray', fontSize: '0.9rem', textAlign: 'center' }}>
            * 표시는 필수 입력 항목입니다.
          </p>
        </form>
      </div>
    </>
  );
}