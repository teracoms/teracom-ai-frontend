#!/usr/bin/env bash
# VOICE_ACCESS_INVESTIGATION_V1 -- (re)generates the self-signed
# certificate deploy/tls/https-proxy.cjs serves. Not committed itself
# (see .gitignore) since the private key must never live in git and the
# certificate is host-specific (its SAN list is this host's own real
# LAN IP) -- run this once per deployment host instead. Safe to re-run;
# overwrites the existing pair.
set -euo pipefail

cd "$(dirname "$0")"

LAN_IP="${VOICE_TLS_LAN_IP:-$(hostname -I | awk '{print $1}')}"
if [ -z "$LAN_IP" ]; then
  echo "Could not auto-detect a LAN IP. Set VOICE_TLS_LAN_IP explicitly, e.g.:" >&2
  echo "  VOICE_TLS_LAN_IP=10.0.0.193 ./generate-cert.sh" >&2
  exit 1
fi

CONF="$(mktemp)"
trap 'rm -f "$CONF"' EXIT
cat > "$CONF" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = $(hostname)-lan

[v3_req]
subjectAltName = @alt_names
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = $(hostname)
DNS.2 = localhost
IP.1 = ${LAN_IP}
IP.2 = 127.0.0.1
EOF

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout voice-lan.key -out voice-lan.crt \
  -days 825 \
  -config "$CONF" -extensions v3_req

echo "Generated deploy/tls/voice-lan.{key,crt} for LAN IP ${LAN_IP} (valid 825 days)."
