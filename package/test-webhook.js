const http = require('http');

const payload = JSON.stringify({
  repository: { name: "BuildOS-MVP" },
  sender: { login: "sunnyshinde" },
  commits: [
    { message: "Implemented Firebase integration and real-time content queue in Next.js" }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/github',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-github-event': 'push',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
