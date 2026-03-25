export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing DEEPSEEK_API_KEY' });

    try {
        const { image } = JSON.parse(req.body);
        
        // DeepSeek 的标准 API 终点
        const url = "https://api.deepseek.com/chat/completions";
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify({
                model: "deepseek-chat", // 如果你有视觉模型权限，请确认模型名称（如 deepseek-vl）
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Identify the total amount, description, and items from this receipt. Return ONLY JSON: { \"total_amount\": number, \"description\": string, \"items\": [{ \"name\": string, \"qty\": number }] }" },
                            { type: "image_url", image_url: { "url": `data:image/png;base64,${image}` } }
                        ]
                    }
                ],
                response_format: { type: 'json_object' } // DeepSeek 支持强制 JSON
            })
        });

        const data = await response.json();
        console.log("DeepSeek Response:", JSON.stringify(data));

        if (data.error) {
            return res.status(500).json(data.error);
        }

        // DeepSeek 返回的格式是 data.choices[0].message.content
        const content = data.choices[0].message.content;
        res.status(200).json(JSON.parse(content));
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
}
