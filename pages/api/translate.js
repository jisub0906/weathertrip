// pages/api/translate.js
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
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
        },
        body: new URLSearchParams({
          text,
          target_lang: targetLang || 'EN'
        })
      });
  
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('번역 실패:', error);
      res.status(500).json({ message: 'Translation failed' });
    }
  }
  