export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;

  const urlMap = {
    login:               'https://api.kolaygelsin.com/api/request/login',
    sort:                'https://api.kolaygelsin.com/api/request/SortShipmentItem',
    getshipments:        'https://api.kolaygelsin.com/api/request/GetShipments',
    getshipmentbyid:     'https://api.kolaygelsin.com/api/request/GetShipmentById',
    getshipmentbyitemid: 'https://api.kolaygelsin.com/api/request/GetShipmentByShipmentItemId',
    getshipmentevents:   'https://api.kolaygelsin.com/api/request/GetShipmentEvents',
    getlabel:            'https://api.kolaygelsin.com/api/request/GETSHIPMENTITEMLABELWITHPRINTTYPE',
    gettickets:          'https://api.kolaygelsin.com/api/request/getTicketRequests',
  };

  const targetUrl = urlMap[endpoint];
  if (!targetUrl) return res.status(400).json({ error: 'Gecersiz endpoint: ' + endpoint });

  try {
    let body, headers;

    if (endpoint === 'login') {
      // Form encoded
      const b = req.body;
      const params = new URLSearchParams();
      params.append('userName', b.userName || '');
      params.append('password', b.password || '');
      params.append('grant_type', 'password');
      params.append('channel', '1');
      params.append('CustomerType', 'null');
      params.append('CaptchaToken', '');
      params.append('VerificationCode', '');
      body = params.toString();
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Origin': 'https://kurumsal.kolaygelsin.com',
        'Referer': 'https://kurumsal.kolaygelsin.com/',
      };
    } else {
      body = JSON.stringify(req.body);
      headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://kurumsal.kolaygelsin.com',
        'Referer': 'https://kurumsal.kolaygelsin.com/',
      };
      if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    }

    const fetchRes = await fetch(targetUrl, { method: 'POST', headers, body });
    const text = await fetchRes.text();

    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(500).json({ error: 'API JSON donmedi', raw: text.substring(0, 200) }); }

    return res.status(fetchRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
