import styles from '../styles/Map.module.css';

const Map = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.mapPageContainer}>
      <div className={styles.mapArea}>
        {/* ... existing map code ... */}
      </div>
      <div className={`${styles.attractionsSidebar} ${isSidebarOpen ? styles.open : ''}`}>
        {/* ... existing sidebar content ... */}
      </div>
      <button 
        className={styles.sidebarToggleButton}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
      >
        {isSidebarOpen ? "×" : "≡"}
      </button>
    </div>
  );
};

export default Map; 