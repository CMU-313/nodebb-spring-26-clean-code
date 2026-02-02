#!/usr/bin/env sh
set -eu

uri="${REDIS_URL:-}"

# Drop scheme
rest="${uri#redis://}"

# Defaults
REDIS_USERNAME=""
REDIS_PASSWORD=""

# Split creds vs host:port
if [ "${rest#*@}" != "$rest" ]; then
  creds="${rest%@*}"      # user:password (or just user)
  hostport="${rest#*@}"   # host:port[/...]
  if [ "${creds#*:}" != "$creds" ]; then
    REDIS_USERNAME="${creds%%:*}"
    REDIS_PASSWORD="${creds#*:}"
  else
    REDIS_USERNAME="$creds"
    REDIS_PASSWORD=""
  fi
else
  hostport="$rest"
fi

# Strip any /db suffix
hostport="${hostport%%/*}"

REDIS_HOST="${hostport%%:*}"
REDIS_PORT="${hostport##*:}"

# Export generic vars
# export REDIS_HOST REDIS_PORT REDIS_USERNAME REDIS_PASSWORD

# Export NodeBB vars
export NODEBB_DB_HOST="$REDIS_HOST"
export NODEBB_DB_PORT="$REDIS_PORT"
export NODEBB_DB_USER="$REDIS_USERNAME"
export NODEBB_DB_PASSWORD="$REDIS_PASSWORD"

exec "$@"
