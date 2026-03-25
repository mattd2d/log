// api/analyze.js
export default async function handler(req, res) {
    // 跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { image } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) return res.status(200).json({ message: "ENV_MISSING: Key not found" });
        
        // 修复：增加类型防御
        if (!image) {
            return res.status(200).json({ message: "DATA_MISSING: Image field is empty" });
        }
        
        // 修复：强制转换成字符串，防止当前端传数组时报错
        let base64Data = String(image); 

        // 修复：增加防御性检查
        if (typeof base64Data === 'string' && base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
        }

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
        res.status(200).json(JSON.parse(aiText));

    } catch (err) {
        console.error("Crash Caught:", err);
        res.status(200).json({ message: "CRASH: " + err.message });
    }
}
