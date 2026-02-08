const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const { initializeDatabase } = require('./init-db');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'netkeeper.db');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  initializeDatabase();
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  db.run('PRAGMA foreign_keys = ON');
  console.log('Database connection established');
});

// Helper functions to convert between DB and API formats
function dbRowToSubnet(row) {
  return {
    id: row.id,
    name: row.name,
    cidr: row.cidr,
    gateway: row.gateway,
    vlan: row.vlan,
    description: row.description
  };
}

function dbRowToVlan(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description
  };
}

function dbRowToIpAddress(row) {
  return {
    id: row.id,
    ip: row.ip,
    hostname: row.hostname,
    deviceType: row.device_type,
    status: row.status,
    subnetId: row.subnet_id,
    macAddress: row.mac_address,
    notes: row.notes,
    lastSeen: row.last_seen
  };
}

function dbRowToNatRule(row) {
  return {
    id: row.id,
    name: row.name,
    externalIp: row.external_ip,
    externalPort: row.external_port,
    internalIp: row.internal_ip,
    internalPort: row.internal_port,
    protocol: row.protocol,
    enabled: Boolean(row.enabled),
    description: row.description
  };
}

function dbRowToWifiNetwork(row) {
  return {
    id: row.id,
    ssid: row.ssid,
    security: row.security,
    password: row.password,
    channel: row.channel,
    band: row.band,
    vlan: row.vlan,
    enabled: Boolean(row.enabled)
  };
}

function dbRowToApplication(row) {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    server: row.server,
    port: row.port,
    url: row.url,
    status: row.status,
    description: row.description
  };
}

// Get all network data
app.get('/api/data', (req, res) => {
  const result = {
    subnets: [],
    vlans: [],
    ipAddresses: [],
    natRules: [],
    wifiNetworks: [],
    applications: []
  };

  db.serialize(() => {
    db.all('SELECT * FROM subnets', [], (err, rows) => {
      if (err) {
        console.error('Error reading subnets:', err);
        return res.status(500).send({ error: 'Failed to read database' });
      }
      result.subnets = rows.map(dbRowToSubnet);

      db.all('SELECT * FROM vlans', [], (err, rows) => {
        if (err) {
          console.error('Error reading vlans:', err);
          return res.status(500).send({ error: 'Failed to read database' });
        }
        result.vlans = rows.map(dbRowToVlan);

        db.all('SELECT * FROM ip_addresses', [], (err, rows) => {
          if (err) {
            console.error('Error reading ip_addresses:', err);
            return res.status(500).send({ error: 'Failed to read database' });
          }
          result.ipAddresses = rows.map(dbRowToIpAddress);

          db.all('SELECT * FROM nat_rules', [], (err, rows) => {
            if (err) {
              console.error('Error reading nat_rules:', err);
              return res.status(500).send({ error: 'Failed to read database' });
            }
            result.natRules = rows.map(dbRowToNatRule);

            db.all('SELECT * FROM wifi_networks', [], (err, rows) => {
              if (err) {
                console.error('Error reading wifi_networks:', err);
                return res.status(500).send({ error: 'Failed to read database' });
              }
              result.wifiNetworks = rows.map(dbRowToWifiNetwork);

              db.all('SELECT * FROM applications', [], (err, rows) => {
                if (err) {
                  console.error('Error reading applications:', err);
                  return res.status(500).send({ error: 'Failed to read database' });
                }
                result.applications = rows.map(dbRowToApplication);
                res.send(result);
              });
            });
          });
        });
      });
    });
  });
});

// Save all network data
app.post('/api/data', (req, res) => {
  const { subnets, vlans, ipAddresses, natRules, wifiNetworks, applications } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Clear existing data
    db.run('DELETE FROM applications');
    db.run('DELETE FROM wifi_networks');
    db.run('DELETE FROM nat_rules');
    db.run('DELETE FROM ip_addresses');
    db.run('DELETE FROM vlans');
    db.run('DELETE FROM subnets');

    // Insert subnets
    const insertSubnet = db.prepare(`
      INSERT INTO subnets (id, name, cidr, gateway, vlan, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    (subnets || []).forEach(s => {
      insertSubnet.run(s.id, s.name, s.cidr, s.gateway, s.vlan, s.description);
    });
    insertSubnet.finalize();

    // Insert VLANs
    const insertVlan = db.prepare(`
      INSERT INTO vlans (id, name, description)
      VALUES (?, ?, ?)
    `);
    (vlans || []).forEach(v => {
      insertVlan.run(v.id, v.name, v.description);
    });
    insertVlan.finalize();

    // Insert IP addresses
    const insertIp = db.prepare(`
      INSERT INTO ip_addresses (id, ip, hostname, device_type, status, subnet_id, mac_address, notes, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (ipAddresses || []).forEach(ip => {
      insertIp.run(
        ip.id, ip.ip, ip.hostname, ip.deviceType, ip.status,
        ip.subnetId, ip.macAddress, ip.notes, ip.lastSeen
      );
    });
    insertIp.finalize();

    // Insert NAT rules
    const insertNat = db.prepare(`
      INSERT INTO nat_rules (id, name, external_ip, external_port, internal_ip, internal_port, protocol, enabled, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (natRules || []).forEach(nat => {
      insertNat.run(
        nat.id, nat.name, nat.externalIp, nat.externalPort,
        nat.internalIp, nat.internalPort, nat.protocol,
        nat.enabled ? 1 : 0, nat.description
      );
    });
    insertNat.finalize();

    // Insert WiFi networks
    const insertWifi = db.prepare(`
      INSERT INTO wifi_networks (id, ssid, security, password, channel, band, vlan, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (wifiNetworks || []).forEach(wifi => {
      insertWifi.run(
        wifi.id, wifi.ssid, wifi.security, wifi.password,
        wifi.channel, wifi.band, wifi.vlan, wifi.enabled ? 1 : 0
      );
    });
    insertWifi.finalize();

    // Insert applications
    const insertApp = db.prepare(`
      INSERT INTO applications (id, name, version, server, port, url, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (applications || []).forEach(app => {
      insertApp.run(
        app.id, app.name, app.version, app.server,
        app.port, app.url, app.status, app.description
      );
    });
    insertApp.finalize();

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error saving data:', err);
        db.run('ROLLBACK');
        return res.status(500).send({ error: 'Failed to save data' });
      }
      res.send({ status: 'success' });
    });
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

/**
 * Device Monitoring Endpoint
 * Pings specific devices and returns their online status
 */
app.post('/api/monitor/check', (req, res) => {
  const { devices } = req.body;
  if (!devices || !Array.isArray(devices)) {
    return res.status(400).send({ error: 'Devices array required' });
  }

  if (devices.length === 0) {
    return res.send({ results: [] });
  }

  // Build fping command for specific IPs
  const addresses = devices.map(d => d.address).join(' ');
  const cmd = `fping -c 1 -t 500 ${addresses}`;

  exec(cmd, (error, stdout, stderr) => {
    // fping outputs to stderr for stats, stdout for results
    // Parse the output to determine which devices responded
    const output = stderr + stdout;
    const results = devices.map(device => {
      // Look for lines like "192.168.1.1 : xmt/rcv/%loss = 1/1/0%"
      // If we see the IP with 0% loss, it's online
      const hasResponse = output.includes(`${device.address} `) && 
                         (output.includes(`${device.address} : xmt/rcv/%loss = 1/1/0%`) ||
                          output.includes(`${device.address} is alive`));
      
      return {
        id: device.id,
        address: device.address,
        isOnline: hasResponse,
        wasOnline: device.wasOnline
      };
    });

    res.send({ results });
  });
});

// SMTP Email Notification Endpoint
app.post('/api/notifications/smtp', async (req, res) => {
  const { config, payload } = req.body;
  
  if (!config || !payload) {
    return res.status(400).json({ error: 'Missing config or payload' });
  }

  try {
    // Dynamic import for nodemailer (optional dependency)
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      return res.status(500).json({ 
        error: 'Nodemailer not installed. Run: npm install nodemailer' 
      });
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password
      }
    });

    const mailOptions = {
      from: config.fromAddress,
      to: config.toAddresses.join(', '),
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('SMTP Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// For SPA routing: serve dist/index.html for all non-api routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NetKeeper Pro Database Service running on port ${PORT}`);
});