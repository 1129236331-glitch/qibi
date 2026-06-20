/**
 * 奇笔 AI · 共享 API 代理
 * 兼容 Vercel Serverless Functions / EdgeOne Pages Cloud Functions
 *
 * 所有用户通过此代理调用 AI 模型，API Key 仅保存在服务端环境变量中。
 * 部署前请在平台设置环境变量：DEEPSEEK_API_KEY
 *
 * 路由: POST /api/proxy
 */

// ====== 模型路由表 ======
const MODEL_ROUTES = {
  // DeepSeek 模型
  'deepseek-chat':           'https://api.deepseek.com/v1/chat/completions',
  'deepseek-reasoner':       'https://api.deepseek.com/v1/chat/completions',
  // Kimi / 月之暗面 模型
  'moonshot-v1-8k':          'https://api.moonshot.cn/v1/chat/completions',
  'moonshot-v1-32k':         'https://api.moonshot.cn/v1/chat/completions',
  'moonshot-v1-128k':        'https://api.moonshot.cn/v1/chat/completions',
};

// 简单内存限流（Vercel 无状态，仅单实例有效）
const RATE_LIMIT_WINDOW = 60_000; // 1 分钟窗口
const RATE_LIMIT_MAX = 20;        // 每分钟最多 20 次请求
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const log = requestLog.get(ip) || [];
  const recent = log.filter(t => now - t < RATE_LIMIT_WINDOW);
  recent.push(now);
  requestLog.set(ip, recent);
  // 定期清理
  if (recent.length > 100) requestLog.delete(ip);
  return recent.length > RATE_LIMIT_MAX;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // === CORS 预检 ===
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // === 限流检查 ===
  const clientIp = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: { message: '请求过于频繁，请稍后再试（每分钟最多20次）' } }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '60',
        },
      }
    );
  }

  // === 读取 API Key ===
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: '服务端未配置 API Key，请联系管理员' } }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // === 解析请求体 ===
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: { message: '请求体格式错误，需要 JSON' } }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // === 确定目标 API 地址 ===
  const model = body.model || 'deepseek-chat';
  const apiEndpoint = MODEL_ROUTES[model] || MODEL_ROUTES['deepseek-chat'];

  // === 确保 streaming 开启 ===
  body.stream = body.stream !== false;

  // === 转发请求 ===
  try {
    const resp = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      let errMsg = '';
      try {
        const err = await resp.json();
        errMsg = err.error?.message || '';
      } catch (_) { /* ignore */ }

      if (resp.status === 401) errMsg = 'API Key 无效或已过期';
      else if (resp.status === 402) errMsg = 'API 额度不足，请联系管理员充值';
      else if (resp.status === 429) errMsg = 'AI 服务繁忙，请稍后再试';
      else if (!errMsg) errMsg = `AI 服务返回错误 (${resp.status})`;

      return new Response(
        JSON.stringify({ error: { message: errMsg, code: resp.status } }),
        {
          status: resp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // === SSE 流式响应透传 ===
    return new Response(resp.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: `代理请求失败: ${err.message}` } }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
