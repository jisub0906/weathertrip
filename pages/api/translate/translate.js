/**
 * DeepL 번역 API 프록시 핸들러
 * - POST: 입력 텍스트를 지정한 언어로 번역하여 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 번역 결과 또는 에러 메시지
 */
export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 요청 본문에서 번역할 텍스트와 대상 언어 추출
  const { text, targetLang } = req.body;

  try {
    // DeepL API로 번역 요청 전송
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang || 'EN', // 기본값: 영어
      }),
    });

    // DeepL API 응답이 실패일 경우 에러 반환
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: `DeepL API 오류: ${response.statusText}` });
    }

    // 번역 결과를 JSON으로 파싱하여 반환
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    // 번역 요청 또는 응답 처리 중 에러 발생 시
    res.status(500).json({ message: 'Translation failed' });
  }
}

  