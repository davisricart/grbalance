const fetch = require('node-fetch');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { siteUrl, clientId } = JSON.parse(event.body || '{}');
    if (!siteUrl) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'siteUrl is required' }) };
    }

    // Extract site name from Netlify URL (e.g., https://sitename.netlify.app)
    const match = siteUrl.match(/https?:\/\/(.*?)\.netlify\.app/);
    const siteName = match ? match[1] : null;
    if (!siteName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid Netlify site URL' }) };
    }

    // Get Netlify API token from env
    const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
    if (!NETLIFY_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'NETLIFY_TOKEN not set in environment' }) };
    }

    // Get site ID from Netlify API (by site name)
    const siteResp = await fetch(`https://api.netlify.com/api/v1/sites/${siteName}`, {
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
    });
    if (!siteResp.ok) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Site not found in Netlify' }) };
    }
    const siteData = await siteResp.json();
    const siteId = siteData.id;

    // Delete the site
    const deleteResp = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
    });
    if (!deleteResp.ok) {
      const err = await deleteResp.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete site', details: err }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Unknown error' }) };
  }
}; 