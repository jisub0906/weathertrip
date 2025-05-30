import { getCollection, toObjectId } from '../lib/db/mongodb';

/**
 * 사용자 데이터 정제 함수
 * @param user - 사용자 객체
 * @param includePassword - 비밀번호 포함 여부
 * @returns 정제된 사용자 데이터 객체
 */
function sanitizeUserData(user, includePassword = false) {
  if (!user) return null;
  const { _id, password, ...userData } = user;
  return {
    id: _id ? _id.toString() : undefined,
    ...(includePassword ? { password } : {}),
    ...userData
  };
}

export const User = {
  /**
   * 사용자 생성
   * @param userData - 사용자 정보 객체
   * @returns 생성된 사용자 데이터(정제)
   * @throws 필수 필드 누락, 형식 오류, 중복 등
   */
  async create(userData) {
    const collection = await getCollection('users');
    // 필수 필드 검증
    const requiredFields = ['name', 'email', 'password', 'nickname', 'phone'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      throw new Error(`필수 필드 누락: ${missingFields.join(', ')}`);
    }
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    }
    // 비밀번호 복잡성 검증
    const password = userData.password;
    if (password.length < 8) {
      throw new Error('비밀번호는 최소 8자 이상이어야 합니다.');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('비밀번호는 소문자를 포함해야 합니다.');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('비밀번호는 대문자를 포함해야 합니다.');
    }
    if (!/\d/.test(password)) {
      throw new Error('비밀번호는 숫자를 포함해야 합니다.');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      throw new Error('비밀번호는 특수문자(!@#$%^&*)를 포함해야 합니다.');
    }
    // 전화번호 검증
    if (!User.validatePhone(userData.phone)) {
      throw new Error('유효하지 않은 전화번호 형식입니다.');
    }
    // 이메일/닉네임/전화번호 중복 체크
    const existingUser = await collection.findOne({
      $or: [
        { email: userData.email },
        { nickname: userData.nickname },
        { phone: userData.phone }
      ]
    });
    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }
      if (existingUser.nickname === userData.nickname) {
        throw new Error('이미 사용 중인 닉네임입니다.');
      }
      if (existingUser.phone === userData.phone) {
        throw new Error('이미 사용 중인 전화번호입니다.');
      }
    }
    // 기본 role 설정
    userData.role = userData.role || 'user';
    // 사용자 저장
    const result = await collection.insertOne(userData);
    return sanitizeUserData({ _id: result.insertedId, ...userData });
  },

  /**
   * 이메일로 사용자 조회
   * @param email - 이메일 주소
   * @returns 사용자 데이터(정제, 비밀번호 포함)
   */
  async findByEmail(email) {
    const collection = await getCollection('users');
    const user = await collection.findOne({ email });
    return sanitizeUserData(user, true);
  },

  /**
   * ID로 사용자 조회
   * @param id - 사용자 ID(ObjectId 또는 문자열)
   * @returns 사용자 데이터(정제)
   */
  async findById(id) {
    const collection = await getCollection('users');
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const user = await collection.findOne({ _id: objectId });
    return sanitizeUserData(user);
  },

  /**
   * 닉네임으로 사용자 조회
   * @param nickname - 닉네임
   * @returns 사용자 데이터(정제)
   */
  async findByNickname(nickname) {
    const collection = await getCollection('users');
    const user = await collection.findOne({ nickname });
    return sanitizeUserData(user);
  },

  /**
   * 전화번호로 사용자 조회
   * @param phone - 전화번호
   * @returns 사용자 데이터(정제)
   */
  async findByPhone(phone) {
    const collection = await getCollection('users');
    const user = await collection.findOne({ phone });
    return sanitizeUserData(user);
  },

  /**
   * 사용자 정보 업데이트
   * @param id - 사용자 ID
   * @param updateData - 업데이트할 데이터
   * @returns 성공 여부(boolean)
   */
  async update(id, updateData) {
    const collection = await getCollection('users');
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  /**
   * 사용자 삭제
   * @param id - 사용자 ID
   * @returns 성공 여부(boolean)
   */
  async delete(id) {
    const collection = await getCollection('users');
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  },

  /**
   * 전화번호 형식 검증
   * @param phone - 전화번호 문자열
   * @returns 유효 여부(boolean)
   */
  validatePhone(phone) {
    const phoneRegex = /^(010|011|016|017|018|019)-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  }
};