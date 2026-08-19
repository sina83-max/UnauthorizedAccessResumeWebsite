#!/bin/bash
# Keep-alive ping for Render free tier
# Prevents the service from sleeping after 15 min of inactivity
#
# Setup on your work VM:
#   chmod +x keep-alive.sh
#   crontab -e
#   Add line: * * * * * /path/to/keep-alive.sh >> /tmp/keepalive.log 2>&1

URL="https://YOUR-APP.onrender.com/api/personal"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL")

if [ "$RESPONSE" != "200" ]; then
    echo "[$(date)] WARN: Health check returned $RESPONSE"
else
    echo "[$(date)] OK: $RESPONSE"
fi
