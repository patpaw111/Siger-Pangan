const axios = require('axios');

async function testDateRange() {
  console.log('Fetching CSRF...');
  const res1 = await axios.get('https://sipangan-lampungprov.badanpangan.go.id/portal/pdi/panel-harga');
  const csrfMatch = res1.data.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';
  const cookies = res1.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  console.log('Fetching map data for 1 month range...');
  const res2 = await axios.post('https://sipangan-lampungprov.badanpangan.go.id/portal/pdi/panel-harga/get-data-map', {
    LEVEL_HARGA: "3",
    KOMODITAS_VALUE: "Beras Premium",
    START_DATE: "2024-01-01",
    END_DATE: "2026-06-07",
    KOMODITAS_ID_MAP: "27",
    _token: csrfToken
  }, {
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!res2.data.data || !res2.data.data.DATA || res2.data.data.DATA.length === 0) {
    console.log('Failed or empty. Response:');
    console.log('Status:', res2.status);
    console.log('Message:', res2.data.message);
    console.log('Data object:', res2.data.data);
    return;
  }
  
  const kotaData = res2.data.data.DATA[0]; // Take first kota
  console.log('Kota:', kotaData.KOTA);
  console.log('Values array length:', kotaData.DATA.Value.length);
  console.log('Sample values:', kotaData.DATA.Value.slice(0, 3));
}

testDateRange().catch(console.error);
