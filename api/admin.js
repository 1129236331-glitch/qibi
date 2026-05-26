/**
 * 奇笔 AI — 管理后台 API
 * 密码保护，支持读取和更新 DeepSeek API Key
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS
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
    res.status(500).json({ error: 'ADMIN_PASSWORD 环境变量未配置' });
    return;
  }
  if (!auth || auth !== `Bearer ${adminPassword}`) {
    res.status(401).json({ error: '密码错误' });
    return;
  }

  // GET: Read current key (masked)
  if (req.method === 'GET') {
    const apiKey = await kv.get('deepseek_api_key');
    if (apiKey) {
      const masked = maskKey(apiKey);
      res.json({ configured: true, key: masked });
    } else {
      res.json({ configured: false, key: null });
    }
    return;
  }

  // POST: Update key
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
    await kv.set('deepseek_api_key', trimmed);
    const masked = maskKey(trimmed);
    res.json({ success: true, key: masked });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function maskKey(key) {
  if (!key || key.length <= 8) return '***';
  return key.substring(0, 5) + '****' + key.substring(key.length - 4);
}
