/**
 * 奇笔 AI — 管理后台 API
 * 密码保护，支持读取/更新 DeepSeek API Key
 * 更新通过 Vercel REST API 修改环境变量并触发重新部署
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Auth check
  const auth = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: 'ADMIN_PASSWORD 未在环境变量中配置' });
    return;
  }
  if (!auth || auth !== `Bearer ${adminPassword}`) {
    res.status(401).json({ error: '密码错误' });
    return;
  }

  // GET: Read current key status
  if (req.method === 'GET') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    res.json({
      configured: !!apiKey,
      key: apiKey ? maskKey(apiKey) : null,
    });
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
    const projectId = process.env.VERCEL_PROJECT_ID || process.env.VITE_VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !projectId) {
      res.status(500).json({
        error: '缺少 VERCEL_TOKEN 或 VERCEL_PROJECT_ID。管理员需在 Vercel 环境变量中配置。'
      });
      return;
    }

    try {
      const baseUrl = 'https://api.vercel.com';
      const teamParam = teamId ? `?teamId=${teamId}` : '';

      // 1. 查找 DEEPSEEK_API_KEY 环境变量 ID
      const envListResp = await fetch(
        `${baseUrl}/v9/projects/${projectId}/env${teamParam ? teamParam : ''}`,
        { headers: { Authorization: `Bearer ${vercelToken}` } }
      );

      if (!envListResp.ok) {
        throw new Error(`获取环境变量列表失败 (${envListResp.status})`);
      }

      const envList = await envListResp.json();
      const targetEnv = envList.envs?.find(e => e.key === 'DEEPSEEK_API_KEY');

      if (!targetEnv) {
        // 如果不存在，创建新的环境变量
        const createResp = await fetch(
          `${baseUrl}/v10/projects/${projectId}/env${teamParam}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key: 'DEEPSEEK_API_KEY',
              value: trimmed,
              type: 'encrypted',
              target: ['production', 'preview', 'development'],
            }),
          }
        );

        if (!createResp.ok) {
          const errData = await createResp.json().catch(() => ({}));
          throw new Error(errData.error?.message || `创建环境变量失败 (${createResp.status})`);
        }
      } else {
        // 更新已存在的环境变量
        const updateUrl = `${baseUrl}/v9/projects/${projectId}/env/${targetEnv.id}${teamParam}`;
        const updateResp = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: trimmed, type: 'encrypted' }),
        });

        if (!updateResp.ok) {
          const errData = await updateResp.json().catch(() => ({}));
          throw new Error(errData.error?.message || `更新环境变量失败 (${updateResp.status})`);
        }
      }

      // 2. 触发重新部署使新环境变量生效
      const deployUrl = `${baseUrl}/v13/deployments${teamParam}`;
      const deployResp = await fetch(deployUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectId,
          target: 'production',
          project: projectId,
        }),
      });

      if (!deployResp.ok) {
        console.warn('重新部署请求可能失败，请手动在 Vercel 控制台重新部署');
      }

      res.json({
        success: true,
        key: maskKey(trimmed),
        message: 'Key 已更新，正在重新部署，约1-2分钟后生效。',
      });
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
