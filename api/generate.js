/**
 * 奇笔 AI — DeepSeek API 代理 (Edge Runtime)
 * 从环境变量读取 Key，转发请求到 DeepSeek，支持 SSE 流式响应
 */

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API Key 未配置，请在管理后台设置' }), {
      status: 503,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    const deepseekResp = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!deepseekResp.ok) {
      const errText = await deepseekResp.text();
      let errMsg = `DeepSeek API 错误 (${deepseekResp.status})`;
      if (deepseekResp.status === 401) errMsg = 'API Key 无效，请在管理后台更新';
      if (deepseekResp.status === 429) errMsg = '请求过于频繁，请稍后再试';
      if (deepseekResp.status === 402) errMsg = 'API 额度不足，请在管理后台更换 Key';

      return new Response(JSON.stringify({ error: errMsg }), {
        status: deepseekResp.status,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    return new Response(deepseekResp.body, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return new Response(JSON.stringify({ error: '代理服务器内部错误' }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
