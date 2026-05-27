/**
 * 奇笔 AI — 管理后台（HTML + API 合一）
 * 无 Auth → 返回管理页面 HTML
 * 有 Auth → 返回 JSON API（读取/更新 Key）
 */

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>奇笔 AI · 管理后台</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0f0f14;color:#e0e0e0;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{width:100%;max-width:480px;padding:20px}
.card{background:#1a1a25;border-radius:16px;padding:32px;border:1px solid #2a2a3a}
h1{font-size:22px;margin-bottom:4px;color:#fff}
.subtitle{font-size:13px;color:#777;margin-bottom:28px}
.label{display:block;font-size:13px;color:#999;margin-bottom:6px}
.input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #333;background:#12121a;color:#e0e0e0;font-size:14px;outline:none;transition:border .2s}
.input:focus{border-color:#6c5ce7}
.btn{width:100%;padding:12px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
.btn-primary{background:#6c5ce7;color:#fff;margin-top:12px}
.btn-primary:hover{background:#7c6cf7}
.btn-primary:disabled{opacity:.5;cursor:not-allowed}
.status{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:10px;margin-bottom:20px;font-size:14px}
.status-ok{background:#0d2818;border:1px solid #1a5c30;color:#4ade80}
.status-empty{background:#1a1a0d;border:1px solid #5c4a1a;color:#facc15}
.dot{width:8px;height:8px;border-radius:50%}
.dot-ok{background:#4ade80}
.dot-empty{background:#facc15}
.key-display{font-family:'SF Mono',monospace;font-size:14px;padding:10px 14px;background:#12121a;border-radius:8px;border:1px solid #2a2a3a;word-break:break-all}
.form-group{margin-bottom:16px}
.divider{height:1px;background:#2a2a3a;margin:24px 0}
.err{color:#f87171;font-size:13px;margin-top:8px;display:none}
.msg{font-size:13px;margin-top:8px;display:none}
.msg-ok{color:#4ade80}
.msg-err{color:#f87171}
.hidden{display:none}
.logout{text-align:right;margin-bottom:16px}
.logout a{color:#666;font-size:13px;text-decoration:none}
.logout a:hover{color:#999}
</style>
</head>
<body>
<div class="container">
  <div class="card" id="login-view">
    <h1>🔐 奇笔 AI 管理后台</h1>
    <p class="subtitle">请输入管理密码以继续</p>
    <form id="login-form">
      <div class="form-group">
        <label class="label">管理密码</label>
        <input type="password" class="input" id="password" placeholder="输入管理后台密码" autofocus>
      </div>
      <button type="submit" class="btn btn-primary">登录</button>
      <div class="err" id="login-err"></div>
    </form>
  </div>
  <div class="card hidden" id="dash-view">
    <div class="logout"><a href="#" id="logout-btn">退出登录</a></div>
    <h1>⚙ 奇笔 AI 管理后台</h1>
    <p class="subtitle">API Key 配置管理</p>
    <div class="status" id="key-status">
      <span class="dot" id="status-dot"></span>
      <span id="status-text">检查中...</span>
    </div>
    <div id="key-info" class="hidden">
      <label class="label">当前 Key</label>
      <div class="key-display" id="current-key">---</div>
    </div>
    <div class="divider"></div>
    <form id="update-form">
      <div class="form-group">
        <label class="label">更新 API Key</label>
        <input type="password" class="input" id="new-key" placeholder="粘贴 DeepSeek API Key（sk-开头）">
      </div>
      <button type="submit" class="btn btn-primary">保存 Key</button>
      <div class="msg" id="update-msg"></div>
    </form>
    <div class="divider"></div>
    <div style="font-size:12px;color:#555;">
      <p>API 代理端点：<code style="color:#777;">/api/generate</code></p>
      <p>前端地址：<a href="https://1129236331-glitch.github.io/qibi/" target="_blank" style="color:#6c5ce7;">qibi</a></p>
    </div>
  </div>
</div>
<script>
let token = localStorage.getItem('qibi_admin_token');
if(token) showDashboard();

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const pw = document.getElementById('password').value.trim();
  const errEl = document.getElementById('login-err');
  errEl.style.display = 'none';
  if(!pw){ errEl.textContent='请输入密码'; errEl.style.display='block'; return; }
  token = pw;
  try{
    const resp = await fetch('/api/admin', { headers: { 'Authorization': 'Bearer '+token } });
    if(resp.ok){ localStorage.setItem('qibi_admin_token',token); showDashboard(); }
    else{ errEl.textContent='密码错误'; errEl.style.display='block'; }
  }catch{ errEl.textContent='网络错误，请重试'; errEl.style.display='block'; }
});

document.getElementById('logout-btn').addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('qibi_admin_token');
  token = null;
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('dash-view').classList.add('hidden');
  document.getElementById('password').value = '';
  document.getElementById('new-key').value = '';
});

document.getElementById('update-form').addEventListener('submit', async e => {
  e.preventDefault();
  const key = document.getElementById('new-key').value.trim();
  const msgEl = document.getElementById('update-msg');
  msgEl.style.display = 'none';
  if(!key){ showMsg('error','请输入 API Key'); return; }
  if(!key.startsWith('sk-')){ showMsg('error','Key 格式不正确，应以 sk- 开头'); return; }
  const btn = e.target.querySelector('button');
  btn.disabled = true; btn.textContent = '保存中...';
  try{
    const resp = await fetch('/api/admin', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
      body: JSON.stringify({ key })
    });
    const data = await resp.json();
    if(resp.ok){ showMsg('ok','Key 已更新：'+data.key); loadKeyStatus(); document.getElementById('new-key').value=''; }
    else{ showMsg('error',data.error||'更新失败'); }
  }catch{ showMsg('error','网络错误'); }
  btn.disabled = false; btn.textContent = '保存 Key';
});

async function showDashboard(){
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('dash-view').classList.remove('hidden');
  await loadKeyStatus();
}

async function loadKeyStatus(){
  const statusEl = document.getElementById('key-status');
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const info = document.getElementById('key-info');
  const curKey = document.getElementById('current-key');
  try{
    const resp = await fetch('/api/admin', { headers:{ 'Authorization':'Bearer '+token } });
    if(resp.status===401){ localStorage.removeItem('qibi_admin_token'); token=null; document.getElementById('login-view').classList.remove('hidden'); document.getElementById('dash-view').classList.add('hidden'); return; }
    const data = await resp.json();
    if(data.configured){
      statusEl.className='status status-ok'; dot.className='dot dot-ok';
      text.textContent='API Key 已配置'; info.classList.remove('hidden'); curKey.textContent=data.key;
    } else {
      statusEl.className='status status-empty'; dot.className='dot dot-empty';
      text.textContent='API Key 未配置，请在下方输入框中添加'; info.classList.add('hidden');
    }
  }catch{ text.textContent='状态检查失败'; }
}

function showMsg(type, text){
  const el = document.getElementById('update-msg');
  el.textContent = text;
  el.className = 'msg ' + (type==='ok'?'msg-ok':'msg-err');
  el.style.display = 'block';
  setTimeout(()=>{ el.style.display='none'; },4000);
}
<\/script>
</body>
</html>`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET without Auth → return admin HTML page
  if (req.method === 'GET' && !req.headers.authorization) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).end(ADMIN_HTML);
    return;
  }

  // Auth check for API operations
  const auth = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: 'ADMIN_PASSWORD 未配置' });
    return;
  }
  if (!auth || auth !== `Bearer ${adminPassword}`) {
    res.status(401).json({ error: '密码错误' });
    return;
  }

  // GET: Read current key status
  if (req.method === 'GET') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    res.json({ configured: !!apiKey, key: apiKey ? maskKey(apiKey) : null });
    return;
  }

  // POST: Update key via Vercel API
  if (req.method === 'POST') {
    const { key } = req.body;
    if (!key || typeof key !== 'string' || !key.trim()) {
      res.status(400).json({ error: '请提供有效的 API Key' });
      return;
    }
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-')) {
      res.status(400).json({ error: 'API Key 格式不正确，应以 sk- 开头' });
      return;
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !projectId) {
      res.status(500).json({ error: '缺少 VERCEL_TOKEN 或 VERCEL_PROJECT_ID' });
      return;
    }

    try {
      const baseUrl = 'https://api.vercel.com';
      const teamParam = teamId ? `?teamId=${teamId}` : '';

      // Find or create DEEPSEEK_API_KEY env var
      const envListResp = await fetch(
        `${baseUrl}/v9/projects/${projectId}/env${teamParam}`,
        { headers: { Authorization: `Bearer ${vercelToken}` } }
      );
      if (!envListResp.ok) throw new Error(`获取环境变量列表失败 (${envListResp.status})`);

      const envList = await envListResp.json();
      const targetEnv = (envList.envs || []).find(e => e.key === 'DEEPSEEK_API_KEY');

      const envPayload = { key: 'DEEPSEEK_API_KEY', value: trimmed, type: 'encrypted', target: ['production', 'preview', 'development'] };

      if (!targetEnv) {
        const createResp = await fetch(`${baseUrl}/v10/projects/${projectId}/env${teamParam}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(envPayload),
        });
        if (!createResp.ok) {
          const err = await createResp.json().catch(() => ({}));
          throw new Error(err.error?.message || `创建环境变量失败 (${createResp.status})`);
        }
      } else {
        const updateResp = await fetch(`${baseUrl}/v9/projects/${projectId}/env/${targetEnv.id}${teamParam}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: trimmed, type: 'encrypted' }),
        });
        if (!updateResp.ok) {
          const err = await updateResp.json().catch(() => ({}));
          throw new Error(err.error?.message || `更新环境变量失败 (${updateResp.status})`);
        }
      }

      // Trigger redeploy
      const deployResp = await fetch(`${baseUrl}/v13/deployments${teamParam}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectId, target: 'production', project: projectId }),
      });
      if (!deployResp.ok) console.warn('重新部署请求失败，请手动在 Vercel 控制台重新部署');

      res.json({ success: true, key: maskKey(trimmed), message: 'Key 已更新，约1-2分钟后生效' });
    } catch (err) {
      console.error('Admin update error:', err);
      res.status(500).json({ error: err.message || '更新失败' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function maskKey(key) {
  if (!key || key.length <= 8) return '***';
  return key.substring(0, 5) + '****' + key.substring(key.length - 4);
}
