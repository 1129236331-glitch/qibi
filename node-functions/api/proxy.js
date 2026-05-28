/**
 * EdgeOne Pages Cloud Function — DeepSeek API 代理
 * 路由: POST /api/proxy
 *
 * 环境变量: 在 EdgeOne Pages 项目设置中配置 DEEPSEEK_API_KEY
 */

export async function onRequestPost(context) {
  // CORS 预检由 EdgeOne Pages 边缘层自动处理
  const apiKey = context.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: '服务端未配置 DEEPSEEK_API_KEY' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: { message: '请求体格式错误' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 确保开启 streaming
  body.stream = body.stream !== false;

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      return new Response(
        JSON.stringify({
          error: {
            message: err?.error?.message || `DeepSeek API 返回 ${resp.status}`,
            code: resp.status,
          },
        }),
        { status: resp.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SSE 流式响应透传
    return new Response(resp.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: '代理请求失败: ' + err.message } }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
