// api/analyze.js
export default async function handler(req, res) {
    // 1. 设置跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        // 2. 健壮的参数解析
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);
        
        const { image } = body || {};
        const API_KEY = process.env.GEMINI_API_KEY;

        // 3. 拦截无效输入
        if (!API_KEY) return res.status(200).json({ message: "后端未配置 GEMINI_API_KEY，请在 Vercel 设置环境变量并 Redeploy。" });
        
        if (!image || String(image) === "[object Object]") {
            return res.status(200).json({ message: "数据传输异常：后端收到的图片数据为空或非法对象。" });
        }

        // 4. 确保 Base64 纯净（再次双重保险）
        let base64Data = String(image);
        if (base64Data.includes(',')) base64Data = base64Data.split(',')[1];

        // 5. 调用 Google Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze receipt. Return JSON ONLY: { \"total_amount\": number, \"description\": \"string\", \"category\": \"Food|Traffic|Shop|Social|Life|Work|Other\", \"items\": [{\"name\":\"string\",\"qty\":\"string\"}] }" },
                        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                    ]
                }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.1 
                }
            })
        });

        const data = await googleResponse.json();

        // 检查 Google 的具体报错
        if (!googleResponse.ok) {
            return res.status(200).json({ 
                message: "Google AI 拒绝请求: " + (data.error?.message || "原因未知"),
                details: data.error 
            });
        }

        // 6. 成功返回
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) throw new Error("AI 响应内容为空");

        res.status(200).json(JSON.parse(aiText));

    } catch (err) {
        console.error("Critical Backend Error:", err);
        // 无论如何返回 JSON，防止前端解析失败
        res.status(200).json({ 
            message: "后端运行异常: " + err.message 
        });
    }
}
