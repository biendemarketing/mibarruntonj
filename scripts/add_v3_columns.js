import https from 'node:https';

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'scvlxcgmhbwjmvycrttf';

const sql = `
  ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS name_en TEXT DEFAULT '';
  ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS description_en TEXT DEFAULT '';
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS diner_count INT DEFAULT 1;
`;

const body = JSON.stringify({ query: sql });

const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Result:', responseData);
  });
});

req.on('error', err => console.error('Req error:', err));
req.write(body);
req.end();
