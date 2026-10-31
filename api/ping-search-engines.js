export default async function handler(req, res) {
  // Solo permitir solicitudes POST o GET
  const urlToPing = req.body?.url || req.query?.url || 'https://mibarruntonj.com/';
  const sitemapUrl = 'https://mibarruntonj.com/sitemap.xml';

  const results = {
    url: urlToPing,
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // 1. PING GOOGLE SITEMAP NOTIFICATION
    try {
      const googleRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: 'GET', headers: { 'User-Agent': 'MiBarruntoBot/1.0' } }
      );
      results.services.google = {
        status: googleRes.status,
        ok: googleRes.ok,
        message: googleRes.ok ? 'Google notificado del sitemap exitosamente' : 'Respuesta recibida de Google'
      };
    } catch (gErr) {
      results.services.google = { error: gErr.message };
    }

    // 2. PING BING / INDEXNOW (Indexación Instantánea para Bing, Copilot, Yandex)
    try {
      const indexNowKey = '9b712001ac8a4be48b056de8d8c37a51';
      const indexNowPayload = {
        host: 'mibarruntonj.com',
        key: indexNowKey,
        keyLocation: `https://mibarruntonj.com/${indexNowKey}.txt`,
        urlList: [urlToPing, sitemapUrl]
      };

      const bingRes = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(indexNowPayload)
      });

      results.services.indexNow = {
        status: bingRes.status,
        ok: bingRes.status === 200 || bingRes.status === 202,
        message: bingRes.status === 200 || bingRes.status === 202 
          ? 'IndexNow aceptó la URL para rastreo inmediato' 
          : `IndexNow HTTP ${bingRes.status}`
      };
    } catch (bErr) {
      results.services.indexNow = { error: bErr.message };
    }

    return res.status(200).json({
      success: true,
      message: 'Notificación de indexación enviada a buscadores',
      results
    });
  } catch (err) {
    console.error('Error in ping-search-engines:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
