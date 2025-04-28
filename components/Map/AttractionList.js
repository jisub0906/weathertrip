import React, { useState, useEffect, useRef } from 'react';

const AttractionList = ({ attractions, onAttractionClick, isVisible, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const listRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // 관광지 클릭 시 목록 닫기
  const handleAttractionClick = (attraction) => {
    onAttractionClick(attraction);
    onClose();
  };

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default AttractionList; 