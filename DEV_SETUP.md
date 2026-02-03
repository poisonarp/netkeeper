# NetKeeper Pro - Development Setup

## Running the Application

### Option 1: Production Mode (Docker)
```bash
# Build and run with Docker
docker compose build
docker compose up

# Access at: http://localhost:3001
```

### Option 2: Development Mode (with hot reload)

#### Start Backend Server (Terminal 1)
```bash
node server.js
```
This starts the API server on port 3001.

#### Start Frontend Dev Server (Terminal 2)
```bash
npm run dev
```
This starts Vite dev server on port 3000 with hot module replacement.

**Access at: http://localhost:3000** (frontend proxies API calls to port 3001)

### Option 3: Run Both Servers Together
```bash
# Install concurrently first
npm install -g concurrently

# Run both servers
npm start
```

## IP Scan Feature

The IP scan feature requires:
1. **Backend server running** (node server.js or docker)
2. **fping installed** on the host system (Linux/Docker only)
   - Install on Debian/Ubuntu: `apt-get install fping`
   - Not available on Windows natively

### Testing Without fping
If fping is not installed, the scan will fall back to demo data for UI testing purposes.

### Troubleshooting

**"Cannot reach backend server" error:**
- Ensure backend is running: `node server.js`
- Check port 3001 is accessible: `curl http://localhost:3001/api/data`
- Verify Vite proxy in vite.config.ts is configured

**No devices found in scan:**
- Check fping is installed: `which fping` or `fping -v`
- Verify CIDR format is correct (e.g., 192.168.1.0/24)
- Ensure you have network access to the target subnet

## Default Credentials
- Username: `admin`
- Password: `admin`
