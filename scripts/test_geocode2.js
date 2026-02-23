require('dotenv').config({ path: '.env.local' });
const cep = '31170750';
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
console.log('Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'Not Found');
const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${cep},+Brasil&key=${apiKey}`;
fetch(googleUrl).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(console.error);
