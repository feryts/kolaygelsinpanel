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
      },
      body: params.toString(),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
      return cachedToken;
    }
    return null;
  } catch(e) {
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
    if (!token) return res.status(401).json({ error: 'Token alinamadi, lutfen daha sonra tekrar deneyin.' });

    const b = req.body || {};
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'bearer ' + token,
      'Origin': 'https://kurumsal.kolaygelsin.com',
      'Referer': 'https://kurumsal.kolaygelsin.com/',
    };

    const fetchRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(b),
    });

    // Token süresi dolmuşsa yenile ve tekrar dene
    if (fetchRes.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      const newToken = await getToken();
      if (!newToken) return res.status(401).json({ error: 'Token yenilenemedi.' });
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
    if (!text || text.trim() === '') return res.status(200).json({ success: true });

    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(200).json({ error: 'JSON parse hatasi', raw: text.substring(0, 200) }); }

    return res.status(fetchRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
