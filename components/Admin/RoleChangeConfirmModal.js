import { useState } from "react";
import styles from "../../styles/RoleChangeConfirmModal.module.css";

/**
 * 역할 변경 시 비밀번호 확인을 위한 모달 컴포넌트
 * @param onConfirm - 비밀번호 입력 후 역할 변경을 확정하는 콜백 함수 (입력된 비밀번호를 인자로 전달)
 * @param onCancel - 모달 닫기/취소 콜백 함수
 * @returns 역할 변경 확인 모달 UI
 */
export default function RoleChangeConfirmModal({ onConfirm, onCancel }) {
  // 비밀번호 입력값 상태 관리
  const [password, setPassword] = useState("");

  /**
   * 확인 버튼 클릭 시 비밀번호 유효성 검사 후 onConfirm 콜백 호출
   * 비밀번호가 비어 있으면 경고창을 띄우고, 입력된 경우에만 onConfirm 실행
   */
  const handleSubmit = () => {
    // 비밀번호가 입력되지 않은 경우 사용자에게 알림
    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    // 입력된 비밀번호를 부모 컴포넌트로 전달
    onConfirm(password);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>🔐 역할 변경 확인</h3>
        <p>역할을 변경하려면 관리자 비밀번호를 입력하세요.</p>

        {/* 비밀번호 입력 필드 */}
        <input
          type="password"
          placeholder="관리자 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className={styles.buttons}>
          {/* 취소 및 확인 버튼 */}
          <button className={styles.cancel} onClick={onCancel}>취소</button>
          <button className={styles.confirm} onClick={handleSubmit}>확인</button>
        </div>
      </div>
    </div>
  );
}