export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API KEY' });

    try {
        const { image } = JSON.parse(req.body);
        
        // 这里的 URL 改为了 v1 版本，并且模型名称加了后缀以确保兼容性
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Identify the total amount, currency, and items from this receipt. Return ONLY JSON: {total_amount: number, description: string, items: [{name: string, qty: number}]}" },
                        { inlineData: { mimeType: "image/png", data: image } }
                    ]
                }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.4
                }
            })
        });

        const data = await response.json();

        // 如果 Google 还是报错，把错误传给前端
        if (data.error) {
            console.error("Google Error:", data.error);
            return res.status(data.error.code || 500).json(data);
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
