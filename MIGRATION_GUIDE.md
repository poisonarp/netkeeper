# SQLite3 Migration Guide

## Overview

NetKeeper Pro has been migrated from JSON file storage to SQLite3 for improved performance, data integrity, and scalability.

## What Changed

### Before (JSON File Storage)
- **Storage**: Single `db.json` file
- **Concurrency**: No concurrent access support
- **Performance**: Full file read/write on every operation
- **Data Integrity**: No transaction support

### After (SQLite3 Database)
- **Storage**: `netkeeper.db` SQLite database file
- **Concurrency**: Multiple processes can safely access database
- **Performance**: Indexed queries, partial updates
- **Data Integrity**: ACID transactions, foreign keys, rollback support

## Database Schema

### Tables Created
- **subnets**: Network subnet definitions
- **vlans**: VLAN configurations
- **ip_addresses**: IP address allocations with device information
- **nat_rules**: NAT/port forwarding rules
- **wifi_networks**: WiFi network configurations
- **applications**: Application inventory

### Key Features
- Foreign key constraints (e.g., IP addresses linked to subnets)
- Indexed columns for fast queries
- Timestamps on all records
- Cascading deletes

## Migration Process

### Automatic Migration
If you have an existing `db.json` file, run the migration script:

```bash
node migrate.js
```

This will:
1. Read your existing `db.json` data
2. Create a backup of any existing SQLite database
3. Initialize the new database schema
4. Import all data into SQLite
5. Preserve your original `db.json` (delete after verification)

### Fresh Installation
If starting fresh, the database will be automatically initialized when you start the server:

```bash
node server.js
```

## Development

### Local Development
```bash
# Install dependencies (includes sqlite3)
npm install

# Run migration if needed
node migrate.js

# Start backend server
node server.js

# Start frontend dev server (in another terminal)
npm run dev
```

### Docker Deployment
The Dockerfile has been updated to support SQLite3:

```bash
# Build image
docker compose build

# Run container
docker compose up
```

**Note**: For persistent data, mount a volume for `/app` directory in `docker-compose.yml`:

```yaml
volumes:
  - ./data:/app
```

## API Compatibility

All API endpoints remain the same:
- `GET /api/data` - Fetch all network data
- `POST /api/data` - Save all network data
- `POST /api/scan` - Scan subnet for devices

The response format is unchanged, ensuring frontend compatibility.

## Benefits

### Performance
- **Queries**: Indexed lookups instead of full file scans
- **Updates**: Modify individual records without rewriting entire database
- **Scalability**: Handles thousands of records efficiently

### Data Integrity
- **Transactions**: All-or-nothing updates prevent corruption
- **Foreign Keys**: Maintain referential integrity (e.g., can't delete subnet with active IPs)
- **Type Safety**: Schema enforces data types

### Concurrent Access
- **Multi-user**: Multiple clients can safely read/write simultaneously
- **Locking**: Built-in SQLite locking prevents conflicts
- **Reliability**: No race conditions or data loss

## Troubleshooting

### Migration Issues
If migration fails:
1. Check that `db.json` is valid JSON
2. Review error messages in console
3. Database backups are created automatically

### Database Corruption
SQLite databases are resilient, but if issues occur:
1. Check for disk space
2. Verify file permissions
3. Restore from backup: `netkeeper.db.backup-[timestamp]`

### Windows Installation
The `sqlite3` npm package includes prebuilt binaries for Windows, no compilation needed.

### Alpine Linux (Docker)
No additional dependencies required in Alpine - `sqlite3` package includes statically linked binaries.

## Future Enhancements

With SQLite3, you can now:
- Add complex queries (e.g., "find unused IPs in specific VLANs")
- Implement audit trails with history tables
- Create database views for reporting
- Add full-text search capabilities
- Export data to other formats easily

## Support

For issues or questions about the database migration, check:
- Server logs: `node server.js` output
- Migration logs: `node migrate.js` output
- Database file: `netkeeper.db` (can be opened with any SQLite tool)
