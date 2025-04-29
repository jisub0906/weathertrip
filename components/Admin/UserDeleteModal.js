// components/Admin/DeleteUserModal.js
import { useState } from "react";
import styles from "../../styles/UserDeleteModal.module.css";

/**
 * 회원 탈퇴(삭제) 시 관리자 비밀번호 확인을 위한 모달 컴포넌트
 * @param user - 탈퇴 대상 사용자 정보 객체 (name, nickname, email 등)
 * @param onClose - 모달 닫기/취소 콜백 함수
 * @param onConfirm - 비밀번호 입력 후 탈퇴 확정 콜백 함수 (입력된 비밀번호를 인자로 전달)
 * @returns 회원 탈퇴 확인 모달 UI
 */
export default function DeleteUserModal({ user, onClose, onConfirm }) {
    // 관리자 비밀번호 입력값 상태 관리
    const [password, setPassword] = useState("");

    /**
     * '탈퇴하기' 버튼 클릭 시 비밀번호 유효성 검사 후 onConfirm 콜백 호출
     * 비밀번호가 비어 있으면 경고창을 띄우고, 입력된 경우에만 onConfirm 실행
     */
    const handleSubmit = () => {
        // 비밀번호가 입력되지 않은 경우 사용자에게 알림
        if (!password.trim()) {
            alert("관리자 비밀번호를 입력해주세요.");
            return;
        }
        // 입력된 비밀번호를 부모 컴포넌트로 전달하여 탈퇴 진행
        onConfirm(password);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>🛑 회원 탈퇴 확인</h3>
                <p><strong>이름:</strong> {user.name}</p>
                <p><strong>닉네임:</strong> {user.nickname}</p>
                <p><strong>이메일:</strong> {user.email}</p>

                {/* 관리자 비밀번호 입력 필드 */}
                <div className={styles.inputGroup}>
                    <label>관리자 확인</label>
                    <input
                        type="password"
                        placeholder="관리자 비밀번호 입력"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className={styles.buttonGroup}>
                    {/* 취소 및 탈퇴 버튼 */}
                    <button className={styles.grayButton} onClick={onClose}>취소</button>
                    <button className={styles.confirmButton} onClick={handleSubmit}>탈퇴하기</button>
                </div>
            </div>
        </div>
    );
}
