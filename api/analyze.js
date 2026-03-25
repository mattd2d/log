export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API KEY' });

    try {
        const { image } = JSON.parse(req.body);
        
        /**
         * 终极兼容性尝试：
         * 1. 路径使用 v1beta (为了支持 responseMimeType)
         * 2. 模型使用 gemini-1.5-flash-001 (比 -latest 更明确，不容易报 404)
         */
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
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
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        const data = await response.json();

        // 记录日志：如果还是报错，我们看看具体的 payload
        console.log("Gemini API Full Response:", JSON.stringify(data));

        if (data.error) {
            // 如果 404 再次发生，尝试一个备选模型名称
            if (data.error.code === 404) {
                console.warn("Retrying with fallback model name...");
                const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;
                const fallbackRes = await fetch(fallbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Return ONLY JSON: { \"total_amount\": number, \"description\": string, \"items\": [{ \"name\": string, \"qty\": number }] }" },
                                { inlineData: { mimeType: "image/png", data: image } }
                            ]
                        }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                const fallbackData = await fallbackRes.json();
                return res.status(fallbackRes.status).json(fallbackData);
            }
            
            console.error("Google Error Details:", data.error);
            return res.status(data.error.code || 500).json(data);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
}
