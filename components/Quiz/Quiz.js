import { useState, useEffect } from 'react';
import styles from '../../styles/Quiz.module.css';

// Fisher-Yates 셔플 알고리즘
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function Quiz({ questions }) {
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // 컴포넌트 마운트 시 문제 섞기
  useEffect(() => {
    setShuffledQuestions(shuffleArray(questions));
  }, [questions]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const handleAnswer = (optionIndex) => {
    setSelectedAnswer(optionIndex);
    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className={styles.resultContainer}>
        <h2 className={styles.resultTitle}>퀴즈 완료!</h2>
        <p className={styles.resultScore}>당신의 점수: {score} / {shuffledQuestions.length}</p>
        <button 
          className={styles.restartButton}
          onClick={() => {
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

  if (!currentQuestion) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <div className={styles.quizContainer}>
      <div className={styles.questionContainer}>
        <p className={styles.question}>{currentQuestion.question}</p>
        <div className={styles.optionsContainer}>
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