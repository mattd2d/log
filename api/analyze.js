export default async function handler(req, res) {
    // 跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 修复：确保 body 存在
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(200).json({ message: "解析请求体失败" });
        }
    }

    const image = body?.image; // 安全获取 image
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(200).json({ message: "环境变量 GEMINI_API_KEY 缺失" });
    if (!image) return res.status(200).json({ message: "前端未传 image 字段" });

    // 强制清理 Base64 头部
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this receipt. Return ONLY JSON: { \"total_amount\": number, \"description\": \"string\", \"category\": \"Food|Traffic|Shop|Social|Life|Work|Other\", \"items\": [{\"name\":\"string\",\"qty\":\"string\"}] }" },
                        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(200).json({ message: "Google API 错误: " + (data.error?.message || "未知") });

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.status(200).json(JSON.parse(aiText));
    } catch (err) {
        res.status(200).json({ message: "运行崩溃: " + err.message });
    }
}
