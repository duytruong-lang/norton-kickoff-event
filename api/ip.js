/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * API Endpoint: /api/ip
 * 
 * Extracts real client IP and Vercel Edge Geolocation metadata
 */

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract client IP address with proxy resolution
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1');

  // Extract Vercel Geolocation headers
  const cityRaw = req.headers['x-vercel-ip-city'];
  let city = '';
  if (cityRaw) {
    try {
      city = decodeURIComponent(cityRaw);
    } catch (e) {
      city = cityRaw;
    }
  }

  const country = req.headers['x-vercel-ip-country'] || '';
  const region = req.headers['x-vercel-ip-country-region'] || '';
  const latitude = req.headers['x-vercel-ip-latitude'] || null;
  const longitude = req.headers['x-vercel-ip-longitude'] || null;
  const timezone = req.headers['x-vercel-ip-timezone'] || 'Asia/Ho_Chi_Minh';
  const userAgent = req.headers['user-agent'] || '';

  return res.status(200).json({
    success: true,
    ip,
    city: city || 'Ho Chi Minh City',
    country: country || 'VN',
    region,
    latitude,
    longitude,
    timezone,
    userAgent,
    timestamp: new Date().toISOString(),
  });
};
