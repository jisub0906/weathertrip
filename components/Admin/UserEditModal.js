import { useState } from "react";
import RoleChangeConfirmModal from "./RoleChangeConfirmModal";
import styles from "../../styles/UserEditModal.module.css";

export default function UserEditModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [nickname, setNickname] = useState(user.nickname);
  const [gender, setGender] = useState(user.gender);
  const [birthdate, setBirthdate] = useState(user.birthdate || "");
  const [role, setRole] = useState(user.role || "user");

  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

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

  const handleSubmit = () => {
    if (user.role !== role) {
      // 역할이 변경되면 인증 모달 띄우기
      setPendingSave(userData);
      setShowRoleConfirm(true);
      console.log('DB에서 찾은 사용자:', user);

    } else {
      onSave(userData);
    }
  };

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