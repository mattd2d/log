export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { image } = req.body;
  // 只认标准命名的变量
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("环境变量 GEMINI_API_KEY 未找到");
    return res.status(500).json({ message: 'Vercel 后台未配置 GEMINI_API_KEY，请检查变量名并重新部署' });
  }

  // 使用 1.5-flash，它是目前最稳定的版本
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: "Analyze receipt. Return JSON: { \"total_amount\": number, \"description\": \"string\", \"category\": \"string\", \"items\": [{\"name\":\"string\",\"qty\":\"string\"}] }" }, 
            { inlineData: { mimeType: "image/jpeg", data: image } } 
          ] 
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Google API 错误:", data);
      return res.status(response.status).json({ message: "Google API 报错: " + (data.error?.message || "未知错误") });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    res.status(200).json(JSON.parse(aiText));
  } catch (error) {
    res.status(500).json({ message: "后端执行出错: " + error.message });
  }
}
