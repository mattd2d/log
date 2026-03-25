export default async function handler(req, res) {
  // 设置跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { image } = req.body;
  
  // 核心修改：只读取这个标准变量名
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ message: '后端未检测到 GEMINI_API_KEY 环境变量' });
  }

  // 使用 1.5-flash 保持稳定
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: "Analyze this receipt. Return ONLY JSON: { \"total_amount\": number, \"description\": \"string\", \"category\": \"string\", \"items\": [{\"name\": \"string\", \"qty\": \"string\"}] }" }, 
            { inlineData: { mimeType: "image/jpeg", data: image } } 
          ] 
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // 解析结果并传回前端
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    res.status(200).json(JSON.parse(aiText));

  } catch (error) {
    res.status(500).json({ message: "API 调用出错: " + error.message });
  }
}
