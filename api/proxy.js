module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;

  const API_BASE = 'https://api.kolaygelsin.com/api/request';
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

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Token eksik' });

  try {
    const b = req.body || {};
    const fetchRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'bearer ' + token,
        'Origin': 'https://kurumsal.kolaygelsin.com',
        'Referer': 'https://kurumsal.kolaygelsin.com/',
      },
      body: JSON.stringify(b),
    });

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
