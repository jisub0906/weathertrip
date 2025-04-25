import { useState } from "react";
import styles from "../../styles/RoleChangeConfirmModal.module.css";

export default function RoleChangeConfirmModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    onConfirm(password);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>🔐 역할 변경 확인</h3>
        <p>역할을 변경하려면 관리자 비밀번호를 입력하세요.</p>

        <input
          type="password"
          placeholder="관리자 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className={styles.buttons}>
          <button className={styles.cancel} onClick={onCancel}>취소</button>
          <button className={styles.confirm} onClick={handleSubmit}>확인</button>
        </div>
      </div>
    </div>
  );
}