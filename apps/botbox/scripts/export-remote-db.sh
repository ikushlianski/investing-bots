#!/bin/bash

set -e

DB_NAME="botbox-db"
OUTPUT_FILE="./remote-db-export.sqlite"

echo "Exporting remote D1 database to local SQLite file..."

# Get list of tables
TABLES=$(npx wrangler d1 execute $DB_NAME --remote --json --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';" | jq -r '.[0].results[].name')

# Remove old export if exists
rm -f "$OUTPUT_FILE"

# Create new SQLite database
sqlite3 "$OUTPUT_FILE" "SELECT 1;" > /dev/null 2>&1

# Export schema
echo "Exporting schema..."
for table in $TABLES; do
    echo "  - $table"
    SCHEMA=$(npx wrangler d1 execute $DB_NAME --remote --json --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='$table';" | jq -r '.[0].results[0].sql')
    sqlite3 "$OUTPUT_FILE" "$SCHEMA"
done

# Export data
echo "Exporting data..."
for table in $TABLES; do
    echo "  - $table"
    DATA=$(npx wrangler d1 execute $DB_NAME --remote --json --command="SELECT * FROM $table;")

    # Parse and insert data (this is simplified, may need adjustment for complex data types)
    COLUMNS=$(echo "$DATA" | jq -r '.[0].results[0] | keys | join(", ")')

    if [ -n "$COLUMNS" ]; then
        echo "$DATA" | jq -r '.[0].results[] | [.[] | tostring] | @csv' | while IFS= read -r row; do
            sqlite3 "$OUTPUT_FILE" "INSERT INTO $table ($COLUMNS) VALUES ($row);" 2>/dev/null || true
        done
    fi
done

echo "Export complete! You can now open '$OUTPUT_FILE' in DBeaver."
echo "File location: $(pwd)/$OUTPUT_FILE"
