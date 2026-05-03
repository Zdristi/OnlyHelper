import https from 'https';
import 'dotenv/config';

const apiKey = process.env.GOOGLE_API_KEY_1; // Assumes key is in .env.local

if (!apiKey) {
  console.error("Error: GOOGLE_API_KEY_1 not found in environment variables.");
  process.exit(1);
}

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.error) {
        console.error("API Error:", parsed.error);
        return;
      }
      const names = parsed.models.map(m => m.name);
      console.log(names.filter(n => n.includes('flash')));
    } catch(e) { console.error("Error parsing JSON:", data); }
  });
});
