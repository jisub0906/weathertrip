import styles from '../../styles/Inquiries.module.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pageNumbers = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, currentPage - half);
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={styles.paginationWrapper}>
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        처음
      </button>
      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {'<'}
      </button>

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

      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {'>'}
      </button>
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