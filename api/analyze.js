// 注意：这个文件里绝对不能有 <html> 标签！
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { image } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY || process.env['Gemini API Key 1'];
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Analyze receipt, return JSON: {amount, desc, cat}" }, { inlineData: { mimeType: "image/png", data: image } }] }]
      })
    });
    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.status(200).json(JSON.parse(aiText));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
