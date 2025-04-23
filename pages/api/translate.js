export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text, targetLang } = req.body;

  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang || 'EN',
      }),
    });

    // ✅ 응답 비어있으면 에러 처리
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepL 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return res.status(response.status).json({ message: `DeepL API 오류: ${response.statusText}` });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('번역 실패:', error);
    res.status(500).json({ message: 'Translation failed' });
  }
}

  