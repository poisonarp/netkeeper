const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    subnets: [],
    vlans: [],
    natRules: [],
    ipAddresses: [],
    wifiNetworks: []
  }));
}

// Get all network data
app.get('/api/data', (req, res) => {
  fs.readFile(DB_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send({ error: 'Failed to read database' });
    res.send(JSON.parse(data));
  });
});

// Save all network data
app.post('/api/data', (req, res) => {
  const data = JSON.stringify(req.body, null, 2);
  fs.writeFile(DB_FILE, data, (err) => {
    if (err) return res.status(500).send({ error: 'Failed to save data' });
    res.send({ status: 'success' });
  });
});

/**
 * Real Network Discovery Endpoint
 * Uses fping to check which hosts are alive in a subnet
 */
app.post('/api/scan', (req, res) => {
  const { cidr } = req.body;
  if (!cidr) return res.status(400).send({ error: 'CIDR required' });

  // fping -g <cidr> -a (show alive) -r 1 (1 retry) -q (quiet)
  // We use -u (show unreach) and -a (show alive) to get a full list if possible
  const cmd = `fping -g ${cidr} -a -r 0 -q`;

  exec(cmd, (error, stdout, stderr) => {
    // fping returns non-zero if some hosts are unreachable, which is normal
    const aliveHosts = stdout.split('\n').filter(ip => ip.trim() !== '');
    res.send({ aliveHosts });
  });
});

// For SPA routing: serve dist/index.html for all non-api routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NetKeeper Pro Database Service running on port ${PORT}`);
});