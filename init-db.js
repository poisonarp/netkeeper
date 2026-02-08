const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'netkeeper.db');

function initializeDatabase(callback) {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      if (callback) callback(err);
      return;
    }
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create all tables
    db.serialize(() => {
      // Create subnets table
      db.run(`
        CREATE TABLE IF NOT EXISTS subnets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          cidr TEXT NOT NULL,
          gateway TEXT,
          vlan INTEGER,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create VLANs table
      db.run(`
        CREATE TABLE IF NOT EXISTS vlans (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create IP addresses table
      db.run(`
        CREATE TABLE IF NOT EXISTS ip_addresses (
          id TEXT PRIMARY KEY,
          ip TEXT NOT NULL,
          hostname TEXT,
          device_type TEXT,
          status TEXT,
          subnet_id TEXT,
          mac_address TEXT,
          notes TEXT,
          last_seen DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE CASCADE
        )
      `);
      
      // Create NAT rules table
      db.run(`
        CREATE TABLE IF NOT EXISTS nat_rules (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          external_ip TEXT NOT NULL,
          external_port INTEGER NOT NULL,
          internal_ip TEXT NOT NULL,
          internal_port INTEGER NOT NULL,
          protocol TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create WiFi networks table
      db.run(`
        CREATE TABLE IF NOT EXISTS wifi_networks (
          id TEXT PRIMARY KEY,
          ssid TEXT NOT NULL,
          security TEXT NOT NULL,
          password TEXT,
          channel INTEGER,
          band TEXT,
          vlan INTEGER,
          enabled INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create applications table
      db.run(`
        CREATE TABLE IF NOT EXISTS applications (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT,
          server TEXT,
          port INTEGER,
          url TEXT,
          status TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes for better query performance
      db.run('CREATE INDEX IF NOT EXISTS idx_ip_subnet ON ip_addresses(subnet_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_ip_status ON ip_addresses(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_subnet_vlan ON subnets(vlan)', (err) => {
        if (err) {
          console.error('Error creating indexes:', err);
        } else {
          console.log('Database initialized successfully at:', DB_PATH);
        }
        db.close();
        if (callback) callback(err);
      });
    });
  });
}

// Run if called directly
if (require.main === module) {
  initializeDatabase((err) => {
    if (err) process.exit(1);
  });
}

module.exports = { initializeDatabase };
