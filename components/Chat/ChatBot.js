// components/chat/ChatBot.js
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/ChatBot.module.css';

/**
 * 관광지 정보, 날씨, 주변 정보 등을 대화형으로 안내하는 챗봇 컴포넌트
 * @param selectedAttraction - 선택된 관광지 객체(선택적)
 * @param userLocation - 사용자 위치 정보(선택적)
 * @returns 챗봇 UI
 */
export default function ChatBot({ selectedAttraction, userLocation }) {
  // 챗봇 창 열림 여부
  const [isOpen, setIsOpen] = useState(false);
  // 대화 메시지 목록
  const [messages, setMessages] = useState([]);
  // 입력창의 현재 텍스트
  const [inputValue, setInputValue] = useState('');
  // 챗봇 타이핑 상태
  const [isTyping, setIsTyping] = useState(false);
  // 오류 발생 여부
  const [hasError, setHasError] = useState(false);
  // 환영 메시지 표시 여부
  const [hasWelcome, setHasWelcome] = useState(false);
  // 메시지 영역 스크롤 이동용 ref
  const messagesEndRef = useRef(null);
  // 입력창 포커스용 ref
  const inputRef = useRef(null);

  /**
   * 메시지 영역이 갱신될 때마다 스크롤을 맨 아래로 이동
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 선택된 관광지 변경 시 환영 메시지 표시
  useEffect(() => {
    if (selectedAttraction && !hasWelcome) {
      setMessages([
        {
          type: 'bot',
          text: `안녕하세요! ${selectedAttraction.name}에 대해 무엇이든 물어보세요.`
        }
      ]);
      setHasWelcome(true);
    }
  }, [selectedAttraction, hasWelcome]);

  // 챗봇 열기/닫기 시 입력창 포커스 처리
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  /**
   * 메시지 전송 및 챗봇 응답 처리
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputValue
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setHasError(false);

    try {
      // API 호출을 위한 데이터 준비
      const requestData = {
        message: userMessage.text,
        attractionId: selectedAttraction?._id,
        ...(userLocation && {
          longitude: userLocation.longitude,
          latitude: userLocation.latitude
        })
      };

      // 챗봇 API 호출
      const response = await fetch('/api/chat/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API 응답 오류 (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '응답 처리 중 오류가 발생했습니다.');
      }

      // 챗봇 응답에 따라 추가 컨텐츠(날씨, 주변 관광지, 상세정보 등) 렌더링
      let additionalContent = null;
      if (data.additionalData?.weather) {
        // 날씨 정보 카드 렌더링
        const weather = data.additionalData.weather;
        additionalContent = (
          <div className={styles.weatherCard}>
            <div className={styles.weatherIcon}>
              {getWeatherIcon(weather.condition, weather.icon)}
            </div>
            <div className={styles.weatherInfo}>
              <span className={styles.temperature}>{weather.temperature}°C</span>
              <span>{weather.description}</span>
              <span className={styles.weatherDetail}>
                체감온도: {weather.feelsLike}°C | 습도: {weather.humidity}%
              </span>
            </div>
          </div>
        );
      } else if (data.additionalData?.nearbyAttractions && data.additionalData.nearbyAttractions.length > 0) {
        // 주변 관광지 리스트 렌더링
        const attractions = data.additionalData.nearbyAttractions;
        additionalContent = (
          <div className={styles.attractionsList}>
            {attractions.slice(0, 5).map((attr, index) => (
              <div 
                key={index} 
                className={styles.attractionItem}
                onClick={() => handleAttractionClick(attr.name)}
              >
                <div className={styles.attractionRow}>
                  <div className={styles.attractionMainInfo}>
                    <div className={styles.attractionIcon}>🏛️</div>
                    <div className={styles.attractionName}>{attr.name}</div>
                  </div>
                  {attr.distance !== undefined && (
                    <div className={styles.distanceBadge}>
                      <span className={styles.distanceIcon}>📍</span>
                      <span>{typeof attr.distance === 'number' ? attr.distance.toFixed(1) : attr.distance}km</span>
                    </div>
                  )}
                </div>
                <div className={styles.attractionTagsRow}>
                  {attr.type && (
                    <div className={styles.typeTag}>
                      {attr.type === 'indoor' ? '🏢 실내' : 
                       attr.type === 'outdoor' ? '🌳 실외' : '🏢🌳 실내/외'}
                    </div>
                  )}
                  {attr.tags && attr.tags.length > 0 && attr.tags.slice(0, 2).map((tag, idx) => (
                    <div key={idx} className={styles.tagBadge}>{tag}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } else if (data.context?.attraction) {
        // 관광지 상세 정보 카드 렌더링
        const attr = data.context.attraction;
        if (attr) {
          additionalContent = (
            <div className={styles.attractionDetail}>
              <div className={styles.attractionRow}>
                <div className={styles.attractionMainInfo}>
                  <div className={styles.attractionIcon}>🏛️</div>
                  <div className={styles.attractionName}>{attr.name}</div>
                </div>
                {attr.distance !== undefined && (
                  <div className={styles.distanceBadge}>
                    <span className={styles.distanceIcon}>📍</span>
                    <span>{typeof attr.distance === 'number' ? attr.distance.toFixed(1) : attr.distance}km</span>
                  </div>
                )}
              </div>
              <div className={styles.attractionTagsRow}>
                {attr.type && (
                  <div className={styles.typeTag}>
                    {attr.type === 'indoor' ? '🏢 실내' : 
                     attr.type === 'outdoor' ? '🌳 실외' : '🏢🌳 실내/외'}
                  </div>
                )}
                {attr.tags && attr.tags.length > 0 && attr.tags.slice(0, 2).map((tag, idx) => (
                  <div key={idx} className={styles.tagBadge}>{tag}</div>
                ))}
              </div>
              {(attr.openingHours || attr.admissionFee) && (
                <div className={styles.attractionExtraInfo}>
                  {attr.openingHours && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>🕒</span>
                      <span>{attr.openingHours}</span>
                    </div>
                  )}
                  {attr.admissionFee && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>💰</span>
                      <span>{attr.admissionFee}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }
      }

      // 자연스러운 대화 경험을 위한 타이핑 지연 효과
      const typingDelay = Math.min(data.response.length * 20, 2000);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: data.response,
          additionalContent: additionalContent
        }]);
      }, typingDelay);

    } catch (error) {
      // 챗봇 API 호출 실패 시 에러 메시지 표시
      setTimeout(() => {
        setIsTyping(false);
        setHasError(true);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          isError: true
        }]);
      }, 500);
    }
  };

  /**
   * 입력창에서 엔터 입력 시 메시지 전송
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 입력창 값 변경 및 자동 높이 조절
   */
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    adjustTextareaHeight(e.target);
  };

  /**
   * 텍스트 영역 높이 자동 조절
   */
  const adjustTextareaHeight = (element) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  };

  /**
   * 날씨 상태/아이콘 코드에 따라 이모지 또는 이미지 반환
   */
  const getWeatherIcon = (condition, iconCode) => {
    if (iconCode) {
      return (
        <img 
          src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`} 
          alt={condition} 
          width={50} 
          height={50} 
        />
      );
    }
    switch (condition) {
      case 'Clear': return '☀️';
      case 'Clouds': return '☁️';
      case 'Rain': return '🌧️';
      case 'Snow': return '❄️';
      case 'Thunderstorm': return '⚡';
      case 'Drizzle': return '🌦️';
      case 'Mist':
      case 'Fog': return '🌫️';
      default: return '🌤️';
    }
  };

  /**
   * 챗봇 헤더 타이틀 반환
   */
  const getChatbotTitle = () => {
    if (selectedAttraction) {
      return `${selectedAttraction.name} 가이드`;
    }
    return '관광 도우미';
  };

  /**
   * 추천 질문 버튼 클릭 시 자동 메시지 전송
   */
  const handleSuggestedQuestionClick = (question) => {
    const userMessage = {
      type: 'user',
      text: question
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setHasError(false);
    const sendMessageWithText = async () => {
      try {
        const requestData = {
          message: question,
          attractionId: selectedAttraction?._id,
          ...(userLocation && {
            longitude: userLocation.longitude,
            latitude: userLocation.latitude
          })
        };
        const response = await fetch('/api/chat/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        if (!response.ok) {
          throw new Error(`API 응답 오류 (${response.status})`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || '응답 처리 중 오류가 발생했습니다.');
        }
        let additionalContent = null;
        if (data.additionalData?.weather) {
          const weather = data.additionalData.weather;
          additionalContent = (
            <div className={styles.weatherCard}>
              <div className={styles.weatherIcon}>
                {getWeatherIcon(weather.condition, weather.icon)}
              </div>
              <div className={styles.weatherInfo}>
                <span className={styles.temperature}>{weather.temperature}°C</span>
                <span>{weather.description}</span>
                <span className={styles.weatherDetail}>
                  체감온도: {weather.feelsLike}°C | 습도: {weather.humidity}%
                </span>
              </div>
            </div>
          );
        } else if (data.additionalData?.nearbyAttractions && data.additionalData.nearbyAttractions.length > 0) {
          const attractions = data.additionalData.nearbyAttractions;
          additionalContent = (
            <div className={styles.attractionsList}>
              {attractions.slice(0, 5).map((attr, index) => (
                <div 
                  key={index} 
                  className={styles.attractionItem}
                  onClick={() => handleAttractionClick(attr.name)}
                >
                  <div className={styles.attractionRow}>
                    <div className={styles.attractionMainInfo}>
                      <div className={styles.attractionIcon}>🏛️</div>
                      <div className={styles.attractionName}>{attr.name}</div>
                    </div>
                    {attr.distance !== undefined && (
                      <div className={styles.distanceBadge}>
                        <span className={styles.distanceIcon}>📍</span>
                        <span>{typeof attr.distance === 'number' ? attr.distance.toFixed(1) : attr.distance}km</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.attractionTagsRow}>
                    {attr.type && (
                      <div className={styles.typeTag}>
                        {attr.type === 'indoor' ? '🏢 실내' : 
                         attr.type === 'outdoor' ? '🌳 실외' : '🏢🌳 실내/외'}
                      </div>
                    )}
                    {attr.tags && attr.tags.length > 0 && attr.tags.slice(0, 2).map((tag, idx) => (
                      <div key={idx} className={styles.tagBadge}>{tag}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        } else if (data.context?.attraction) {
          const attr = data.context.attraction;
          if (attr) {
            additionalContent = (
              <div className={styles.attractionDetail}>
                <div className={styles.attractionRow}>
                  <div className={styles.attractionMainInfo}>
                    <div className={styles.attractionIcon}>🏛️</div>
                    <div className={styles.attractionName}>{attr.name}</div>
                  </div>
                  {attr.distance !== undefined && (
                    <div className={styles.distanceBadge}>
                      <span className={styles.distanceIcon}>📍</span>
                      <span>{typeof attr.distance === 'number' ? attr.distance.toFixed(1) : attr.distance}km</span>
                    </div>
                  )}
                </div>
                <div className={styles.attractionTagsRow}>
                  {attr.type && (
                    <div className={styles.typeTag}>
                      {attr.type === 'indoor' ? '🏢 실내' : 
                       attr.type === 'outdoor' ? '🌳 실외' : '🏢🌳 실내/외'}
                    </div>
                  )}
                  {attr.tags && attr.tags.length > 0 && attr.tags.slice(0, 2).map((tag, idx) => (
                    <div key={idx} className={styles.tagBadge}>{tag}</div>
                  ))}
                </div>
                {(attr.openingHours || attr.admissionFee) && (
                  <div className={styles.attractionExtraInfo}>
                    {attr.openingHours && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>🕒</span>
                        <span>{attr.openingHours}</span>
                      </div>
                    )}
                    {attr.admissionFee && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>💰</span>
                        <span>{attr.admissionFee}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
        }
        const typingDelay = Math.min(data.response.length * 20, 2000);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            type: 'bot',
            text: data.response,
            additionalContent: additionalContent
          }]);
        }, typingDelay);
      } catch (error) {
        setTimeout(() => {
          setIsTyping(false);
          setHasError(true);
          setMessages(prev => [...prev, {
            type: 'bot',
            text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            isError: true
          }]);
        }, 500);
      }
    };
    sendMessageWithText();
  };

  /**
   * 관광지 항목 클릭 시 해당 관광지 정보 자동 질문 전송
   */
  const handleAttractionClick = (attractionName) => {
    const question = `${attractionName} 알려줘`;
    const userMessage = {
      type: 'user',
      text: question
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setHasError(false);
    const sendMessageWithText = async () => {
      try {
        const requestData = {
          message: question,
          attractionId: selectedAttraction?._id,
          ...(userLocation && {
            longitude: userLocation.longitude,
            latitude: userLocation.latitude
          })
        };
        const response = await fetch('/api/chat/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        if (!response.ok) {
          throw new Error(`API 응답 오류 (${response.status})`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || '응답 처리 중 오류가 발생했습니다.');
        }
        let additionalContent = null;
        if (data.additionalData?.weather) {
          const weather = data.additionalData.weather;
          additionalContent = (
            <div className={styles.weatherCard}>
              <div className={styles.weatherIcon}>
                {getWeatherIcon(weather.condition, weather.icon)}
              </div>
              <div className={styles.weatherInfo}>
                <span className={styles.temperature}>{weather.temperature}°C</span>
                <span>{weather.description}</span>
                <span className={styles.weatherDetail}>
                  체감온도: {weather.feelsLike}°C | 습도: {weather.humidity}%
                </span>
              </div>
            </div>
          );
        } else if (data.additionalData?.nearbyAttractions && data.additionalData.nearbyAttractions.length > 0) {
          const attractions = data.additionalData.nearbyAttractions;
          additionalContent = (
            <div className={styles.attractionsList}>
              {attractions.slice(0, 5).map((attr, index) => (
                <div 
                  key={index} 
                  className={styles.attractionItem}
                  onClick={() => handleAttractionClick(attr.name)}
                >
                  <div className={styles.attractionRow}>
                    <div className={styles.attractionMainInfo}>
                      <div className={styles.attractionIcon}>🏛️</div>
                      <div className={styles.attractionName}>{attr.name}</div>
                    </div>
                    {attr.distance !== undefined && (
                      <div className={styles.distanceBadge}>
                        <span className={styles.distanceIcon}>📍</span>
                        <span>{typeof attr.distance === 'number' ? attr.distance.toFixed(1) : attr.distance}km</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.attractionTagsRow}>
                    {attr.type && (
                      <div className={styles.typeTag}>
                        {attr.type === 'indoor' ? '🏢 실내' : 
                         attr.type === 'outdoor' ? '🌳 실외' : '🏢🌳 실내/외'}
                      </div>
                    )}
                    {attr.tags && attr.tags.length > 0 && attr.tags.slice(0, 2).map((tag, idx) => (
                      <div key={idx} className={styles.tagBadge}>{tag}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        } else if (data.context?.attraction) {
          const attr = data.context.attraction;
          if (attr) {
            additionalContent = (
              <div className={styles.attractionDetail}>
                <div className={styles.attractionRow}>
                  <div className={styles.attractionMainInfo}>
                    <div className={styles.attractionIcon}>🏛️</div>
                    <div className={styles.attractionName}>{attr.name}</div>
                  </div>
                  {attr.distance !== undefined && (
                    <div className={styles.distanceBadge}>
                      <span className={styles.distanceIcon}>📍</span>
                      <span>{typeof attr.distance === 'number' ? attr.distance.toFixed(1) : attr.distance}km</span>
                    </div>
                  )}
                </div>
                <div className={styles.attractionTagsRow}>
                  {attr.type && (
                    <div className={styles.typeTag}>
                      {attr.type === 'indoor' ? '🏢 실내' : 
                       attr.type === 'outdoor' ? '🌳 실외' : '🏢🌳 실내/외'}
                    </div>
                  )}
                  {attr.tags && attr.tags.length > 0 && attr.tags.slice(0, 2).map((tag, idx) => (
                    <div key={idx} className={styles.tagBadge}>{tag}</div>
                  ))}
                </div>
                {(attr.openingHours || attr.admissionFee) && (
                  <div className={styles.attractionExtraInfo}>
                    {attr.openingHours && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>🕒</span>
                        <span>{attr.openingHours}</span>
                      </div>
                    )}
                    {attr.admissionFee && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>💰</span>
                        <span>{attr.admissionFee}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
        }
        const typingDelay = Math.min(data.response.length * 20, 2000);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            type: 'bot',
            text: data.response,
            additionalContent: additionalContent
          }]);
        }, typingDelay);
      } catch (error) {
        setTimeout(() => {
          setIsTyping(false);
          setHasError(true);
          setMessages(prev => [...prev, {
            type: 'bot',
            text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            isError: true
          }]);
        }, 500);
      }
    };
    sendMessageWithText();
  };

  /**
   * 추천 질문 렌더링
   */
  const renderSuggestedQuestions = () => {
    let questions = ['주변 관광지 알려줘', '오늘 날씨 어때?'];
    if (selectedAttraction) {
      questions = [
        `${selectedAttraction.name} 영업시간이 어떻게 돼?`,
        `${selectedAttraction.name} 입장료는 얼마야?`,
        '주변 맛집 추천해줘',
        '오늘 날씨 어때?'
      ];
    }
    return (
      <div className={styles.suggestedQuestions}>
        {questions.map((q, idx) => (
          <button 
            key={idx}
            className={styles.suggestedQuestion}
            onClick={() => handleSuggestedQuestionClick(q)}
          >
            {q}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.chatbotContainer} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
      >
        {isOpen ? '×' : '💬'}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <span>{getChatbotTitle()}</span>
          </div>
          
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcomeMessage}>
                <h3>안녕하세요! 관광 도우미입니다</h3>
                <p>관광지에 대해 궁금한 점이 있으시면 질문해주세요.</p>
                {renderSuggestedQuestions()}
              </div>
            )}
            
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`${styles.message} ${message.type === 'user' ? styles.user : styles.bot} ${message.isError ? styles.error : ''}`}
              >
                {/* 메시지 텍스트를 줄바꿈을 유지하여 표시 */}
                {message.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
                
                {/* 추가 컨텐츠 (관광지 카드 등) */}
                {message.additionalContent && (
                  <div className={styles.additionalContent}>
                    {message.additionalContent}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className={`${styles.message} ${styles.bot} ${styles.typing}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              rows={1}
              disabled={isTyping}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isTyping || !inputValue.trim()}
              className={styles.sendButton}
            >
            </button>
          </div>
        </div>
      )}
    </div>
  );
}