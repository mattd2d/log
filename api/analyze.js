export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API KEY' });

    try {
        const { image } = JSON.parse(req.body);
        
        // 关键修复：在 v1beta 中，使用 gemini-1.5-flash-latest 更加稳定
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Identify the total amount, currency, and items from this receipt. Return ONLY JSON: { \"total_amount\": number, \"description\": string, \"items\": [{ \"name\": string, \"qty\": number }] }" },
                        { inlineData: { mimeType: "image/png", data: image } }
                    ]
                }],
                generationConfig: { 
                    // 保持 v1beta 下的强制 JSON 输出配置
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        const data = await response.json();

        // 记录日志以便在 Vercel 后台观察
        console.log("Gemini API Response:", JSON.stringify(data));

        if (data.error) {
            console.error("Google Error Details:", data.error);
            return res.status(data.error.code || 500).json(data);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
}
