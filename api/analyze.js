// api/analyze.js
export default async function handler(req, res) {
    // 1. 强力跨域支持
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // 2. 暴力获取请求体（兼容所有中间件）
        let rawBody = '';
        if (req.body && typeof req.body === 'object') {
            rawBody = req.body;
        } else {
            // 如果 Vercel 没解析，手动解析字符串
            rawBody = JSON.parse(req.body || "{}");
        }

        const image = rawBody.image;
        const API_KEY = process.env.GEMINI_API_KEY;

        // 3. 错误预防提示
        if (!API_KEY) return res.status(200).send({ message: "ENV_MISSING: Key not found" });
        if (!image) return res.status(200).send({ message: "DATA_MISSING: Image field empty" });

        const base64Data = image.includes(',') ? image.split(',')[1] : image;

        // 4. 调用 Google API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Return JSON only: { \"total_amount\": number, \"description\": \"string\", \"category\": \"Food|Traffic|Shop|Social|Life|Work|Other\", \"items\": [{\"name\":\"string\",\"qty\":\"string\"}] }" },
                        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(200).json({ 
                message: "GOOGLE_ERROR: " + (data.error?.message || "Check API Key") 
            });
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        // 5. 确保返回的是干净的 JSON 对象
        res.status(200).json(JSON.parse(aiText));

    } catch (err) {
        // 关键：捕捉所有错误并以 JSON 形式返回，防止触发 Vercel 的 500 页面
        console.error(err);
        res.status(200).json({ message: "CRASH: " + err.message });
    }
}
