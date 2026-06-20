/**
 * 奇笔 AI · 本地开发服务器
 * - 托管静态文件（ai-tools.html 等）
 * - 代理 /api/proxy → DeepSeek API
 * - 零依赖，node server.js 即可启动
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

// ===== 加载 .env 文件 =====
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && val) process.env[key] = val;
  }
}

// ===== MIME 类型 =====
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

// ===== 辅助：读取请求体 =====
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// ===== 辅助：发送 JSON 响应 =====
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ===== 创建服务器 =====
loadEnv();

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ====== /api/proxy ======
  if (req.url === '/api/proxy' && req.method === 'POST') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return json(res, 500, {
        error: { message: '服务端未配置 API Key，请联系管理员' }
      });
    }

    let payload;
    try { payload = await readBody(req); }
    catch { return json(res, 400, { error: { message: '请求体格式错误' } }); }

    payload.stream = payload.stream !== false;

    try {
      const resp = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        // Node 24 原生 fetch，默认无超时，60s 够用
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return json(res, resp.status, {
          error: { message: err.error?.message || `AI 服务返回 ${resp.status}`, code: resp.status }
        });
      }

      // SSE 透传
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const reader = resp.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
      res.end();
    } catch (err) {
      return json(res, 502, { error: { message: `代理请求失败: ${err.message}` } });
    }
    return;
  }

  // ====== 静态文件 ======
  let urlPath = req.url.split('?')[0]; // 去掉 query string
  if (urlPath === '/') urlPath = '/ai-tools.html';

  const filePath = path.join(__dirname, urlPath);

  // 防止目录穿越
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // 禁止访问隐藏文件和敏感路径
  const relative = path.relative(__dirname, filePath);
  if (relative.startsWith('.') || relative.includes('/.')) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback: 未知路由返回 index.html
        const indexFile = path.join(__dirname, 'ai-tools.html');
        fs.readFile(indexFile, (_err2, indexData) => {
          if (_err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(indexData);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const hasKey = !!process.env.DEEPSEEK_API_KEY;
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   ✦ 奇笔 AI · 本地开发服务器 ✦     ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║   👉 http://localhost:${PORT}            ║`);
  console.log('  ║                                      ║');
  if (hasKey) {
    console.log('  ║   ✅ DEEPSEEK_API_KEY 已配置          ║');
    console.log('  ║   🤖 真实 AI 生成已就绪               ║');
  } else {
    console.log('  ║   ⚠️  未配置 DEEPSEEK_API_KEY         ║');
    console.log('  ║   创建 .env 文件以启用真 AI 生成       ║');
    console.log('  ║   当前将使用本地样本作为降级方案       ║');
  }
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
