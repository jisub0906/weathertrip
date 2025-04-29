import { useState } from "react";
import RoleChangeConfirmModal from "./RoleChangeConfirmModal";
import styles from "../../styles/UserEditModal.module.css";

/**
 * 회원 정보 수정 모달 컴포넌트
 * @param user - 수정 대상 사용자 정보 객체
 * @param onClose - 모달 닫기/취소 콜백 함수
 * @param onSave - 수정된 정보 저장 콜백 함수
 * @returns 회원 정보 수정 모달 UI
 */
export default function UserEditModal({ user, onClose, onSave }) {
  // 각 입력 필드별 상태 관리
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [nickname, setNickname] = useState(user.nickname);
  const [gender, setGender] = useState(user.gender);
  const [birthdate, setBirthdate] = useState(user.birthdate || "");
  const [role, setRole] = useState(user.role || "user");

  // 역할 변경 시 확인 모달 노출 여부 및 임시 저장 데이터
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  // 현재 입력된 사용자 정보 객체
  const userData = {
    id: user._id,
    name,
    email,
    phone,
    nickname,
    gender,
    birthdate,
    role,
  };

  /**
   * 저장 버튼 클릭 시 역할 변경 여부에 따라 분기 처리
   * 역할이 변경된 경우 관리자 인증 모달을 띄우고, 그렇지 않으면 바로 저장 콜백 호출
   */
  const handleSubmit = () => {
    if (user.role !== role) {
      // 역할이 변경된 경우: 인증 모달을 띄우고, 입력값을 임시 저장
      setPendingSave(userData);
      setShowRoleConfirm(true);
    } else {
      // 역할이 변경되지 않은 경우: 바로 저장
      onSave(userData);
    }
  };

  /**
   * 역할 변경 인증 모달에서 비밀번호 입력 후 호출되는 콜백
   * 관리자 비밀번호와 함께 저장 콜백을 실행
   * @param adminPassword - 입력된 관리자 비밀번호
   */
  const handleRoleConfirm = (adminPassword) => {
    setShowRoleConfirm(false);
    onSave({ ...pendingSave, adminPassword });
    setPendingSave(null);
  };

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h3>✏️ 회원정보 수정</h3>

          {/* 기본 정보 입력폼 */}
          <div className={styles.infoRow}>
            <label>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={styles.infoRow}>
            <label>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.infoRow}>
            <label>전화번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className={styles.infoRow}>
            <label>닉네임</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className={styles.infoRow}>
            <label>성별</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">선택</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
          <div className={styles.infoRow}>
            <label>생일</label>
            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
          </div>
          <div className={styles.infoRow}>
            <label>역할</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">일반 사용자</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.grayButton} onClick={onClose}>취소</button>
            <button className={styles.submitButton} onClick={handleSubmit}>저장</button>
          </div>
        </div>
      </div>

      {/* 역할 변경 확인 모달 */}
      {showRoleConfirm && (
        <RoleChangeConfirmModal
          onCancel={() => setShowRoleConfirm(false)}
          onConfirm={handleRoleConfirm}
        />
      )}
    </>
  );
}