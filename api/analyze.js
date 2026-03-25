export default async function handler(req, res) {
  // 设置跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { image } = req.body;
  
  // 环境变量：请确保 Vercel 后台 Key 的名字和这里一致
  const API_KEY = process.env.GEMINI_API_KEY || process.env['Gemini API Key 1'];

  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key 未配置' });
  }

  // 使用 Google Gemini 官方链接 (直接调用全局 fetch)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: "Analyze this receipt. Return ONLY JSON: { \"amount\": number, \"desc\": \"string\", \"cat\": \"string\" }" }, 
            { inlineData: { mimeType: "image/png", data: image } }
          ] 
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) return res.status(response.status).json(data);

    // 提取并清理 AI 返回的文本
    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(aiText));

  } catch (error) {
    res.status(500).json({ message: "后端执行出错: " + error.message });
  }
}
