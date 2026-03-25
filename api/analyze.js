export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    const { image } = JSON.parse(req.body);

    try {
        // 尝试最原始的 v1 稳定版路径
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Return JSON: {total_amount: number, description: string}" },
                        { inlineData: { mimeType: "image/png", data: image } }
                    ]
                }]
                // 注意：这里删除了 generationConfig，防止因为参数不支持导致 400
            })
        });

        const data = await response.json();
        console.log("Final Debug Log:", JSON.stringify(data));
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
