import Head from 'next/head';
import Header from '../components/Layout/Header';
import Quiz from '../components/Quiz/Quiz';
import styles from '../styles/Quiz.module.css';
import { useState, useEffect } from 'react';

export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/quiz/quiz');
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <>
        <Head>
          <title>관광지 퀴즈 | 날씨 관광 앱</title>
          <meta name="description" content="한국의 관광지에 대한 퀴즈를 풀어보세요!" />
        </Head>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>로딩 중...</div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>관광지 퀴즈 | 날씨 관광 앱</title>
          <meta name="description" content="한국의 관광지에 대한 퀴즈를 풀어보세요!" />
        </Head>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.error}>
              <h2>에러가 발생했습니다</h2>
              <p>{error}</p>
              <p>서버 콘솔에서 더 자세한 에러 정보를 확인할 수 있습니다.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>관광지 퀴즈 | 날씨 관광 앱</title>
        <meta name="description" content="한국의 관광지에 대한 퀴즈를 풀어보세요!" />
      </Head>

      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>관광지 퀴즈</h1>
          <p className={styles.subtitle}>한국의 관광지에 대한 퀴즈를 풀어보세요!</p>
          <Quiz questions={questions} />
        </div>
      </main>
    </>
  );
} 