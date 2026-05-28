/**
 * Vercel Serverless Function — DeepSeek API 代理
 * 
 * 作用：
 * 1. 隐藏 API Key（存放在 Vercel 环境变量 DEEPSEEK_API_KEY 中）
 * 2. 解决前端直连 DeepSeek 的 CORS 跨域问题
 * 3. 支持 streaming（SSE）透传
 * 
 * 部署：在 Vercel 项目设置中添加环境变量 DEEPSEEK_API_KEY
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: '服务端未配置 DEEPSEEK_API_KEY 环境变量' }
    });
  }

  const body = req.body;

  // 确保启用 streaming
  const payload = {
    ...body,
    stream: body.stream !== false,
  };

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      return res.status(resp.status).json({
        error: {
          message: err?.error?.message || `DeepSeek API 返回 ${resp.status}`,
          code: resp.status,
        }
      });
    }

    // Streaming: 直接透传 SSE 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({
      error: { message: '代理请求失败: ' + err.message }
    });
  }
}
