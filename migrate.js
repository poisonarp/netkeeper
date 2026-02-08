const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'netkeeper.db');
const JSON_PATH = path.join(__dirname, 'db.json');

function migrateFromJson() {
  console.log('Starting migration from db.json to SQLite...');
  
  // Check if JSON file exists
  if (!fs.existsSync(JSON_PATH)) {
    console.log('No db.json file found. Nothing to migrate.');
    return;
  }

  // Read existing JSON data
  const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log('Read existing db.json');
  
  // Initialize database
  const { initializeDatabase } = require('./init-db');
  if (fs.existsSync(DB_PATH)) {
    console.log('Backing up existing database...');
    fs.copyFileSync(DB_PATH, `${DB_PATH}.backup-${Date.now()}`);
  }
  
  initializeDatabase((err) => {
    if (err) {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    }
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
      }
      
      db.run('PRAGMA foreign_keys = ON');
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Migrate subnets
        const insertSubnet = db.prepare(`
          INSERT INTO subnets (id, name, cidr, gateway, vlan, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        (jsonData.subnets || []).forEach(s => {
          insertSubnet.run(s.id, s.name, s.cidr, s.gateway, s.vlan, s.description);
        });
        insertSubnet.finalize();
        console.log(`Migrated ${(jsonData.subnets || []).length} subnets`);

        // Migrate VLANs
        const insertVlan = db.prepare(`
          INSERT INTO vlans (id, name, description)
          VALUES (?, ?, ?)
        `);
        (jsonData.vlans || []).forEach(v => {
          insertVlan.run(v.id, v.name, v.description);
        });
        insertVlan.finalize();
        console.log(`Migrated ${(jsonData.vlans || []).length} VLANs`);

        // Migrate IP addresses
        const insertIp = db.prepare(`
          INSERT INTO ip_addresses (id, ip, hostname, device_type, status, subnet_id, mac_address, notes, last_seen)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        (jsonData.ipAddresses || []).forEach(ip => {
          insertIp.run(
            ip.id, ip.ip, ip.hostname, ip.deviceType, ip.status,
            ip.subnetId, ip.macAddress, ip.notes, ip.lastSeen
          );
        });
        insertIp.finalize();
        console.log(`Migrated ${(jsonData.ipAddresses || []).length} IP addresses`);

        // Migrate NAT rules
        const insertNat = db.prepare(`
          INSERT INTO nat_rules (id, name, external_ip, external_port, internal_ip, internal_port, protocol, enabled, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        (jsonData.natRules || []).forEach(nat => {
          insertNat.run(
            nat.id, nat.name, nat.externalIp, nat.externalPort,
            nat.internalIp, nat.internalPort, nat.protocol,
            nat.enabled ? 1 : 0, nat.description
          );
        });
        insertNat.finalize();
        console.log(`Migrated ${(jsonData.natRules || []).length} NAT rules`);

        // Migrate WiFi networks
        const insertWifi = db.prepare(`
          INSERT INTO wifi_networks (id, ssid, security, password, channel, band, vlan, enabled)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        (jsonData.wifiNetworks || []).forEach(wifi => {
          insertWifi.run(
            wifi.id, wifi.ssid, wifi.security, wifi.password,
            wifi.channel, wifi.band, wifi.vlan, wifi.enabled ? 1 : 0
          );
        });
        insertWifi.finalize();
        console.log(`Migrated ${(jsonData.wifiNetworks || []).length} WiFi networks`);

        // Migrate applications
        const insertApp = db.prepare(`
          INSERT INTO applications (id, name, version, server, port, url, status, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        (jsonData.applications || []).forEach(app => {
          insertApp.run(
            app.id, app.name, app.version, app.server,
            app.port, app.url, app.status, app.description
          );
        });
        insertApp.finalize();
        console.log(`Migrated ${(jsonData.applications || []).length} applications`);

        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Migration failed:', err);
            db.run('ROLLBACK');
            db.close();
            process.exit(1);
          } else {
            console.log('\n✅ Migration completed successfully!');
            console.log(`SQLite database created at: ${DB_PATH}`);
            console.log(`\nOriginal db.json has been preserved. You can delete it once you verify the migration.`);
            db.close();
          }
        });
      });
    });
  });
}

// Run if called directly
if (require.main === module) {
  migrateFromJson();
}

module.exports = { migrateFromJson };
