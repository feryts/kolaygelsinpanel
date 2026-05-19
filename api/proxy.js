const KG_USER = 'seyhanbs';
const KG_PASS = '153759';
const API_BASE = 'https://api.kolaygelsin.com/api/request';

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const params = new URLSearchParams();
  params.append('userName', KG_USER);
  params.append('password', KG_PASS);
  params.append('grant_type', 'password');
  params.append('channel', '1');
  params.append('CustomerType', 'null');
  params.append('CaptchaToken', '');
  params.append('VerificationCode', '');
  try {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Origin': 'https://kurumsal.kolaygelsin.com',
        'Referer': 'https://kurumsal.kolaygelsin.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: params.toString(),
    });
    console.log('Login status:', res.status);
    const text = await res.text();
    console.log('Login response:', text.substring(0, 200));
    const data = JSON.parse(text);
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
      console.log('Token alindi!');
      return cachedToken;
    }
    console.log('Token alinamadi:', JSON.stringify(data));
    return null;
  } catch(e) {
    console.log('Login hatasi:', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;

  const urlMap = {
    sort:                API_BASE + '/SortShipmentItem',
    getshipments:        API_BASE + '/GetShipments',
    getshipmentbyid:     API_BASE + '/GetShipmentById',
    getshipmentbyitemid: API_BASE + '/GetShipmentByShipmentItemId',
    getshipmentevents:   API_BASE + '/GetShipmentEvents',
    getlabel:            API_BASE + '/GETSHIPMENTITEMLABELWITHPRINTTYPE',
    gettickets:          API_BASE + '/getTicketRequests',
  };

  const targetUrl = urlMap[endpoint];
  if (!targetUrl) return res.status(400).json({ error: 'Gecersiz endpoint: ' + endpoint });

  try {
    const token = await getToken();
    if (!token) return res.status(200).json({ error: 'Token alinamadi. Servis gecici olarak kullanilamiyor.' });

    const b = req.body || {};
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'bearer ' + token,
      'Origin': 'https://kurumsal.kolaygelsin.com',
      'Referer': 'https://kurumsal.kolaygelsin.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    console.log('API call:', endpoint, JSON.stringify(b).substring(0, 100));
    const fetchRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(b),
    });
    console.log('API status:', fetchRes.status);

    if (fetchRes.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      const newToken = await getToken();
      if (!newToken) return res.status(200).json({ error: 'Token yenilenemedi.' });
      const retryRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { ...headers, 'Authorization': 'bearer ' + newToken },
        body: JSON.stringify(b),
      });
      const retryText = await retryRes.text();
      if (!retryText || retryText.trim() === '') return res.status(200).json({ success: true });
      try { return res.status(retryRes.status).json(JSON.parse(retryText)); }
      catch(e) { return res.status(200).json({ error: 'JSON parse hatasi', raw: retryText.substring(0, 200) }); }
    }

    const text = await fetchRes.text();
    console.log('API response:', text.substring(0, 200));
    if (!text || text.trim() === '') return res.status(200).json({ success: true });

    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(200).json({ error: 'JSON parse hatasi', raw: text.substring(0, 200) }); }

    return res.status(fetchRes.status).json(data);
  } catch (err) {
    console.log('Handler hatasi:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
