#!/bin/bash

set -e

DB_DIR="/Users/ikushlianski/webdata/ilya-projects/investing-tool/apps/botbox/.wrangler/state/v3/d1/miniflare-D1DatabaseObject"
SOURCE_DB="4a8c6ce4d5eb19b74e00284e87377aab882bd97731fefbdc65a8cb96c606727c.sqlite"

echo "Syncing local D1 databases..."

for db in "$DB_DIR"/*.sqlite; do
    db_name=$(basename "$db")

    if [ "$db_name" != "$SOURCE_DB" ]; then
        echo "Copying $SOURCE_DB to $db_name"
        cp "$DB_DIR/$SOURCE_DB" "$db"
    fi
done

echo "All databases synced!"
