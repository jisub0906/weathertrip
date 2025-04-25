// components/Admin/DeleteUserModal.js
import { useState } from "react";
import styles from "../../styles/UserDeleteModal.module.css";

export default function DeleteUserModal({ user, onClose, onConfirm }) {
    const [password, setPassword] = useState("");

    const handleSubmit = () => {
        if (!password.trim()) {
            alert("관리자 비밀번호를 입력해주세요.");
            return;
        }
        onConfirm(password); // 비밀번호와 함께 탈퇴 진행
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>🛑 회원 탈퇴 확인</h3>
                <p><strong>이름:</strong> {user.name}</p>
                <p><strong>닉네임:</strong> {user.nickname}</p>
                <p><strong>이메일:</strong> {user.email}</p>

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
                    <button className={styles.grayButton} onClick={onClose}>취소</button>
                    <button className={styles.confirmButton} onClick={handleSubmit}>탈퇴하기</button>
                </div>
            </div>
        </div>
    );
}
