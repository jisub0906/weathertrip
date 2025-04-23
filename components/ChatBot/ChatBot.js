import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/ChatBot.module.css';

export default function ChatBot() {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [preloadedImages, setPreloadedImages] = useState(new Set());

  const preloadImage = useCallback((url) => {
    return new Promise((resolve) => {
      if (preloadedImages.has(url)) {
        resolve(url);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, url]));
        resolve(url);
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }, [preloadedImages]);

  useEffect(() => {
    // 챗봇 관련 이미지 프리로드
    const chatImages = [
      '/images/chatbot-avatar.png',
      '/images/weather-icons/sunny.png',
      '/images/weather-icons/rainy.png',
      '/images/weather-icons/cloudy.png'
    ];

    Promise.all(chatImages.map(preloadImage))
      .catch(error => console.error('챗봇 이미지 프리로드 실패:', error));
  }, [preloadImage]);

  const handleImageLoad = useCallback((url) => {
    setLoadedImages(prev => new Set([...prev, url]));
  }, []);

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatbotHeader}>
        <div className={styles.avatarWrapper}>
          <Image
            src="/images/chatbot-avatar.png"
            alt="챗봇 아바타"
            width={40}
            height={40}
            quality={85}
            style={{
              opacity: loadedImages.has('/images/chatbot-avatar.png') ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            onLoad={() => handleImageLoad('/images/chatbot-avatar.png')}
          />
          {!loadedImages.has('/images/chatbot-avatar.png') && (
            <div className={styles.skeletonAvatar} />
          )}
        </div>
        <h3>날씨 여행 가이드</h3>
      </div>

      <div className={styles.weatherIcons}>
        {['sunny', 'rainy', 'cloudy'].map((type) => (
          <div key={type} className={styles.weatherIconWrapper}>
            <Image
              src={`/images/weather-icons/${type}.png`}
              alt={`${type} 날씨 아이콘`}
              width={24}
              height={24}
              quality={85}
              style={{
                opacity: loadedImages.has(`/images/weather-icons/${type}.png`) ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoad={() => handleImageLoad(`/images/weather-icons/${type}.png`)}
            />
            {!loadedImages.has(`/images/weather-icons/${type}.png`) && (
              <div className={styles.skeletonIcon} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 