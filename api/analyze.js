export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API KEY' });

    try {
        const { image } = JSON.parse(req.body);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this receipt. Return ONLY a plain JSON object: { \"total_amount\": number, \"description\": \"string\", \"items\": [{\"name\": \"string\", \"qty\": number}] }" },
                        { inlineData: { mimeType: "image/png", data: image } }
                    ]
                }]
            })
        });

        const data = await response.json();

        // 记录完整的响应到 Vercel 日志，以便最后排查
        console.log("Gemini API Full Response:", JSON.stringify(data));

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
