import { useState, useEffect } from 'react';
import styles from '../../styles/Quiz.module.css';

/**
 * [목적] 배열을 무작위로 섞는 Fisher-Yates 셔플 알고리즘
 * @param array - 섞을 배열
 * @returns 섞인 새 배열
 */
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * 퀴즈 문제 풀이 컴포넌트
 * @param questions - 퀴즈 문제 배열 [{ question, options, correctAnswer, explanation }]
 * @returns 퀴즈 UI
 */
export default function Quiz({ questions }) {
  // 셔플된 문제 배열
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  // 현재 문제 인덱스
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // 정답 개수(점수)
  const [score, setScore] = useState(0);
  // 결과 화면 표시 여부
  const [showResult, setShowResult] = useState(false);
  // 사용자가 선택한 답변 인덱스
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  /**
   * [목적] 컴포넌트 마운트/문제 변경 시 문제 배열을 무작위로 섞어 상태에 저장
   */
  useEffect(() => {
    setShuffledQuestions(shuffleArray(questions));
  }, [questions]);

  // 현재 문제 객체
  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  /**
   * [목적] 사용자가 답변을 선택하면 정답 여부를 판별하고 상태를 갱신
   * @param optionIndex - 선택한 답변 인덱스
   */
  const handleAnswer = (optionIndex) => {
    setSelectedAnswer(optionIndex);
    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  /**
   * [목적] 다음 문제로 이동하거나, 마지막 문제라면 결과 화면을 표시
   */
  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  // 퀴즈 완료 시 결과 화면 렌더링
  if (showResult) {
    return (
      <div className={styles.resultContainer}>
        <h2 className={styles.resultTitle}>퀴즈 완료!</h2>
        <p className={styles.resultScore}>당신의 점수: {score} / {shuffledQuestions.length}</p>
        <button 
          className={styles.restartButton}
          onClick={() => {
            // 퀴즈 재시작: 상태 초기화 및 문제 셔플
            setShuffledQuestions(shuffleArray(questions));
            setCurrentQuestionIndex(0);
            setScore(0);
            setShowResult(false);
            setSelectedAnswer(null);
          }}
        >
          다시 시작하기
        </button>
      </div>
    );
  }

  // 문제 데이터가 준비되지 않은 경우 로딩 표시
  if (!currentQuestion) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <div className={styles.quizContainer}>
      <div className={styles.questionContainer}>
        <p className={styles.question}>{currentQuestion.question}</p>
        <div className={styles.optionsContainer}>
          {/* 선택지 버튼 렌더링 */}
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`${styles.option} ${
                selectedAnswer === index ? styles.selected : ''
              }`}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          ))}
        </div>
        {/* 답변 선택 후 피드백 및 해설, 다음 문제 버튼 */}
        {selectedAnswer !== null && (
          <div className={styles.feedback}>
            <p>
              {selectedAnswer === currentQuestion.correctAnswer
                ? '정답입니다!'
                : '틀렸습니다!'}
            </p>
            <p className={styles.explanation}>{currentQuestion.explanation}</p>
            <button className={styles.nextButton} onClick={handleNextQuestion}>
              다음 문제
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 