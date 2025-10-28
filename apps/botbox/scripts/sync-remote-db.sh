#!/bin/bash

set -e

cd "$(dirname "$0")/.."

DB_NAME="botbox-db"
SQL_FILE="./remote-db-export.sql"
SQLITE_FILE="./remote-db-export.sqlite"

echo "📦 Exporting remote D1 database '$DB_NAME'..."
npx wrangler d1 export $DB_NAME --remote --output=$SQL_FILE

echo "🔄 Converting to SQLite database..."
rm -f $SQLITE_FILE
sqlite3 $SQLITE_FILE < $SQL_FILE

echo "✅ Database synced successfully!"
echo "📍 Location: $(pwd)/$SQLITE_FILE"
echo ""
echo "You can now open this file in DBeaver."
