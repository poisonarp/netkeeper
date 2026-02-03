#!/bin/bash

# NetKeeper Pro - Full Stack Debian 13 (Trixie) LXC Installer
# Version: 2.1.0 (Real Discovery Integration)

set -e

echo "🚀 Starting NetKeeper Pro Installation..."

# 1. Update System
echo "📦 Updating package repositories..."
apt-get update && apt-get upgrade -y

# 2. Install Core Dependencies
echo "🛠 Installing Node.js, Nginx, and system utilities..."
# Ensure gpg and certificates are present for NodeSource
apt-get install -y curl ca-certificates gnupg build-essential fping git

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx

# 4. Create Directory Structure
echo "📁 Setting up application root..."
APP_ROOT="/var/www/netkeeper"
mkdir -p $APP_ROOT

# 5. Copy Application Files
echo "💾 Deploying application files..."
cp -r . $APP_ROOT/
cd $APP_ROOT

# 6. Install Backend Dependencies
echo "📦 Installing npm packages..."
npm install

# 7. Configure Systemd Service
echo "⚙️ Creating Database Service..."
cat > /etc/systemd/system/netkeeper.service <<EOF
[Unit]
Description=NetKeeper Pro Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_ROOT
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable netkeeper
systemctl start netkeeper

# 8. Configure Nginx as Reverse Proxy
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/netkeeper <<EOF
server {
    listen 80;
    server_name _;

    root $APP_ROOT;
    index index.html;

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static Files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

ln -sf /etc/nginx/sites-available/netkeeper /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "✅ NetKeeper Pro (Full-Stack) is now installed!"
echo "🌐 Access it at: http://$(hostname -I | cut -d' ' -f1)"
echo "💾 Data is persisted in: $APP_ROOT/db.json"
echo "🔍 Real scanning via 'fping' is enabled."