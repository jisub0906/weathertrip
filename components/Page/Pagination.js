import styles from '../../styles/Inquiries.module.css';

/**
 * 페이지네이션 컴포넌트
 * @param currentPage - 현재 페이지 번호
 * @param totalPages - 전체 페이지 수
 * @param onPageChange - 페이지 변경 시 호출되는 콜백 함수
 * @returns 페이지네이션 UI
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // 렌더링할 페이지 번호 목록
  const pageNumbers = [];
  // 한 번에 보여줄 최대 페이지 버튼 개수
  const maxVisible = 5;
  // 현재 페이지를 중앙에 배치하기 위한 offset
  const half = Math.floor(maxVisible / 2);

  /**
   * [목적] 시작/끝 페이지 번호를 계산하여, 현재 페이지가 중앙에 오도록 조정
   * [의도] UX 개선 - 항상 5개 버튼이 보이고, 현재 페이지가 중앙에 위치하도록 함
   */
  let startPage = Math.max(1, currentPage - half);
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // 실제 렌더링할 페이지 번호 배열 생성
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={styles.paginationWrapper}>
      {/* 처음 페이지로 이동 */}
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        처음
      </button>
      {/* 이전 페이지로 이동 */}
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {'<'}
      </button>

      {/* 페이지 번호 버튼 렌더링 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          className={
            page === currentPage ? styles.pageButtonActive : styles.pageButton
          }
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {/* 다음 페이지로 이동 */}
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {'>'}
      </button>
      {/* 마지막 페이지로 이동 */}
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        맨끝
      </button>
    </div>
  );
}