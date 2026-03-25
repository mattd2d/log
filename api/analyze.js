export default async function handler(req, res) {
  // 设置跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // 建议加上这个
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { image } = req.body;
  
  // 环境变量兼容性处理
  const API_KEY = process.env.GEMINI_API_KEY || process.env['Gemini API Key 1'];

  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key is not configured in Vercel environment variables.' });
  }

  // 使用稳定的 flash 模型，2.5-flash-preview 可能不稳定，建议用 1.5-flash 或最新的稳定版
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            // 重点：要求 AI 返回 items 数组，否则你的 Box 页面拿不到数据
            { text: "Analyze this receipt. Return ONLY JSON: { \"total_amount\": number, \"description\": \"string\", \"category\": \"string\", \"items\": [{\"name\": \"string\", \"qty\": \"string\"}] }. Translate item names to English." }, 
            { inlineData: { mimeType: "image/jpeg", data: image } } 
          ] 
        }],
        // 强制要求输出 JSON 格式（Gemini 1.5+ 支持）
        generationConfig: {
            responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) return res.status(response.status).json(data);

    // 提取并清理 AI 返回的文本
    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // 如果没有配置 generationConfig，可能需要手动清理 markdown
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 解析 JSON
    const parsedData = JSON.parse(aiText);

    // 数据清洗：确保字段名和你的前端脚本一致
    const finalData = {
        total_amount: parsedData.total_amount || parsedData.amount || 0,
        description: parsedData.description || parsedData.desc || "",
        category: parsedData.category || parsedData.cat || "Other",
        items: parsedData.items || []
    };

    res.status(200).json(finalData);

  } catch (error) {
    res.status(500).json({ message: "Backend error: " + error.message });
  }
}
