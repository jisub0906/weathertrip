import { getCollection, toObjectId } from '../lib/db/mongodb';

// ✅ 사용할 도시 리스트
const validCities = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주도'
];

// ✅ 전화번호 앞자리 enum
const validPhonePrefixes = ['010', '011', '016', '017', '018', '019'];

// 사용자 데이터 정제 함수
function sanitizeUserData(user, includePassword = false) {
  if (!user) return null;
  
  const { _id, password, ...userData } = user;
  return {
    id: _id.toString(),
    ...(includePassword ? { password } : {}),
    ...userData
  };
}

export const User = {
  async create(userData) {
    try {
      console.log('사용자 생성 시작:', {
        ...userData,
        password: '비밀번호는 숨김'
      });

      const collection = await getCollection('users');
      
      // 필수 필드 검증
      const requiredFields = ['name', 'email', 'password', 'nickname', 'phone'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }

      // 비밀번호 길이 검증
      if (userData.password.length < 4) {
        throw new Error('비밀번호는 최소 4자리 이상이어야 합니다.');
      }

      // 닉네임 검증
      if (userData.nickname.length < 1) {
        throw new Error('닉네임은 최소 1글자 이상이어야 합니다.');
      }

      if (/^\d/.test(userData.nickname)) {
        throw new Error('닉네임은 숫자로 시작할 수 없습니다.');
      }

      // 전화번호 검증
      if (!this.validatePhone(userData.phone)) {
        throw new Error('유효하지 않은 전화번호 형식입니다.');
      }

      // 중복 체크
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('이미 가입된 이메일입니다.');
      }

      const existingNickname = await this.findByNickname(userData.nickname);
      if (existingNickname) {
        throw new Error('이미 사용 중인 닉네임입니다.');
      }

      const existingPhone = await this.findByPhone(userData.phone);
      if (existingPhone) {
        throw new Error('이미 사용 중인 전화번호입니다.');
      }

      console.log('사용자 데이터 검증 완료');

      const result = await collection.insertOne({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (!result.insertedId) {
        throw new Error('사용자 생성에 실패했습니다.');
      }

      console.log('사용자 생성 성공:', result.insertedId.toString());
      return result.insertedId.toString();
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      throw error;
    }
  },
  
  async findByEmail(email) {
    try {
      const collection = await getCollection('users');
      const user = await collection.findOne({ email });
      return sanitizeUserData(user, true);
    } catch (error) {
      console.error('이메일로 사용자 찾기 오류:', error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const collection = await getCollection('users');
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const user = await collection.findOne({ _id: objectId });
      return sanitizeUserData(user);
    } catch (error) {
      console.error('ID로 사용자 찾기 오류:', error);
      throw error;
    }
  },

  async findByNickname(nickname) {
    try {
      const collection = await getCollection('users');
      const user = await collection.findOne({ nickname });
      return sanitizeUserData(user);
    } catch (error) {
      console.error('닉네임으로 사용자 찾기 오류:', error);
      throw error;
    }
  },

  async findByPhone(phone) {
    try {
      const collection = await getCollection('users');
      const user = await collection.findOne({ phone });
      return sanitizeUserData(user);
    } catch (error) {
      console.error('전화번호로 사용자 찾기 오류:', error);
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const collection = await getCollection('users');
      const objectId = toObjectId(id);
      if (!objectId) return null;
      
      const result = await collection.updateOne(
        { _id: objectId },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('사용자 업데이트 오류:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const collection = await getCollection('users');
      const objectId = toObjectId(id);
      if (!objectId) return null;
      
      const result = await collection.deleteOne({ _id: objectId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      throw error;
    }
  },

  validatePhone(phone) {
    // 전화번호 형식 확인 (000-0000-0000 형식 또는 직접 숫자만 입력)
    if (!phone) return false;

    // 하이픈 제거 후 숫자만 확인
    const digits = phone.replace(/\D/g, '');
    
    // 10-11자리 확인 (지역번호 포함)
    if (digits.length !== 10 && digits.length !== 11) return false;
    
    // 앞 3자리 확인
    const prefix = digits.slice(0, 3);
    if (!validPhonePrefixes.includes(prefix)) return false;
    
    // 숫자로만 구성되어 있는지 확인
    return /^\d+$/.test(digits);
  },

  validateCity(city) {
    return validCities.includes(city);
  }
};