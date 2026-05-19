export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;

  const urlMap = {
    login:              'https://api.kolaygelsin.com/api/request/login',
    sort:               'https://api.kolaygelsin.com/api/request/SortShipmentItem',
    getshipments:       'https://api.kolaygelsin.com/api/request/GetShipments',
    getshipmentbyid:    'https://api.kolaygelsin.com/api/request/GetShipmentById',
    getshipmentbyitemid:'https://api.kolaygelsin.com/api/request/GetShipmentByShipmentItemId',
    getshipmentevents:  'https://api.kolaygelsin.com/api/request/GetShipmentEvents',
    getlabel:           'https://api.kolaygelsin.com/api/request/GETSHIPMENTITEMLABELWITHPRINTTYPE',
    gettickets:         'https://api.kolaygelsin.com/api/request/getTicketRequests',
  };

  const targetUrl = urlMap[endpoint];
  if (!targetUrl) return res.status(400).json({ error: 'Gecersiz endpoint: ' + endpoint });

  try {
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'tr,en;q=0.9',
      'Origin': 'https://kurumsal.kolaygelsin.com',
      'Referer': 'https://kurumsal.kolaygelsin.com/',
    };

    if (endpoint === 'login') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      headers['Content-Type'] = 'application/json';
      if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    }

    const fetchRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? (
        endpoint === 'login'
          ? new URLSearchParams(req.body).toString()
          : JSON.stringify(req.body)
      ) : undefined,
    });

    const data = await fetchRes.json();
    return res.status(fetchRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
