import mongoose from 'mongoose';

// ✅ 사용할 도시 리스트
const validCities = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도',
  '경상북도', '경상남도',
  '제주도'
];

// ✅ 전화번호 앞자리 enum
const validPhonePrefixes = ['010', '011', '016', '017', '018', '019'];

// ✅ 닉네임 숫자 시작 여부 검사
const startsWithNumber = (value) => /^\d/.test(value);

const UserSchema = new mongoose.Schema({
  // 1. 이름
  name: {
    type: String,
    required: [true, '이름은 필수입니다.'],
    trim: true
  },

  // 2. 이메일 (중복 방지 + 메시지)
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    trim: true,
    validate: {
      validator: async function (value) {
        const existing = await mongoose.models.User.findOne({ email: value });
        return !existing;
      },
      message: '이미 가입된 메일입니다.'
    }
  },

  // 3. 비밀번호 (이메일과 다르도록)
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
    minlength: [4, '비밀번호는 최소 4자리 이상이어야 합니다.'],
    validate: {
      validator: function (value) {
        return value !== this.email;
      },
      message: '비밀번호는 이메일과 같을 수 없습니다.'
    }
  },

  // 4. 닉네임 (중복 방지 + 숫자시작 금지)
  nickname: {
    type: String,
    required: [true, '닉네임은 필수입니다.'],
    unique: true,
    trim: true,
    minlength: [1, '닉네임은 최소 1글자 이상이어야 합니다.'],
    validate: {
      validator: function (value) {
        return !startsWithNumber(value);
      },
      message: '닉네임은 숫자로 시작할 수 없습니다.'
    }
  },

  // 5. 성별 (라디오 박스 대비)
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, '성별을 선택해주세요.']
  },

  // 6. 생년월일 (기본값: 오늘)
  birthdate: {
    type: Date,
    default: Date.now
  },

  // 7. 전화번호 (유효성 + 자동 포맷 + 중복방지)
  phone: {
    type: String,
    required: [true, '전화번호는 필수입니다.'],
    unique: true,
    trim: true,
    set: function (raw) {
      // 숫자만 남기고 하이픈 자동 삽입
      const digits = raw.replace(/\D/g, '');
      if (digits.length === 10) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      }
      return raw;
    },
    validate: {
      validator: async function (value) {
        const match = value.match(/^(\d{3})-(\d{3,4})-(\d{4})$/);
        if (!match) return false;

        const prefix = match[1];
        const existing = await mongoose.models.User.findOne({ phone: value });
        return validPhonePrefixes.includes(prefix) && !existing;
      },
      message: '이미 가입된 전화번호이거나 형식이 올바르지 않습니다. (예: 01012345678)'
    }
  },

  // 8. 지역 (기본값 대한민국 + 도시 선택)
  region: {
    country: {
      type: String,
      default: '대한민국',
      enum: ['대한민국'] // 추후 국가 추가 가능
    },
    city: {
      type: String,
      enum: validCities
    }
  }

}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);