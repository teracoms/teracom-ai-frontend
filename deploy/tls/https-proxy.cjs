#!/usr/bin/env node
'use strict';

// VOICE_ACCESS_INVESTIGATION_V1 -- a minimal, dependency-free HTTPS
// reverse proxy in front of the already-running plain-HTTP Next.js
// server (127.0.0.1:3000). Real fix, not a workaround: the Web Speech
// API and navigator.mediaDevices.getUserMedia() are both restricted by
// every current browser to a "secure context" (HTTPS, or
// localhost/127.0.0.1 specifically exempted) -- accessing this
// platform via a plain-HTTP LAN IP (http://10.0.0.193:3000) can never
// grant real microphone access, no matter what the customer clicks in
// their browser's permission prompt. See Operations/REVERSE_PROXY_AND_TLS.md
// for why a full public Let's Encrypt certificate remains blocked
// (no root access, no public DNS-resolvable domain) -- this proxy uses
// a real, locally-generated self-signed certificate instead, which is
// sufficient to satisfy `window.isSecureContext` (and therefore real
// microphone access) even though the browser will show a one-time
// "not trusted" warning the user must click through, since the
// certificate isn't signed by a public CA. This is the correct interim
// fix for a private/internal LAN deployment; it is not a substitute
// for the real public-domain TLS setup once this host has one.
//
// No new npm dependency: uses only Node's built-in `http`/`https`
// modules. Binds an unprivileged port (default 3443) so no root is
// required, unlike binding 443 directly.

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const LISTEN_PORT = Number(process.env.VOICE_TLS_PORT || 3443);
const LISTEN_HOST = process.env.VOICE_TLS_HOST || '0.0.0.0';
const TARGET_HOST = process.env.VOICE_TLS_TARGET_HOST || '127.0.0.1';
const TARGET_PORT = Number(process.env.VOICE_TLS_TARGET_PORT || 3000);

const certDir = __dirname;
const options = {
  key: fs.readFileSync(path.join(certDir, 'voice-lan.key')),
  cert: fs.readFileSync(path.join(certDir, 'voice-lan.crt')),
};

function proxyRequest(clientReq, clientRes) {
  const forwardHeaders = { ...clientReq.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
  // Next.js reads x-forwarded-proto in a couple of places (secure
  // cookies, absolute-URL generation) -- forwarding the real scheme
  // here keeps that logic honest rather than believing the backend
  // hop (which really is plain HTTP) is the whole story.
  forwardHeaders['x-forwarded-proto'] = 'https';
  forwardHeaders['x-forwarded-host'] = clientReq.headers.host || '';

  const upstreamReq = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      method: clientReq.method,
      path: clientReq.url,
      headers: forwardHeaders,
    },
    (upstreamRes) => {
      clientRes.writeHead(upstreamRes.statusCode, upstreamRes.headers);
      upstreamRes.pipe(clientRes);
    },
  );

  upstreamReq.on('error', (err) => {
    console.error('[voice-https-proxy] upstream error:', err.message);
    if (!clientRes.headersSent) clientRes.writeHead(502, { 'content-type': 'text/plain' });
    clientRes.end('Bad gateway -- upstream Next.js server unreachable.');
  });

  clientReq.pipe(upstreamReq);
}

const server = https.createServer(options, proxyRequest);

server.on('clientError', (err, socket) => {
  if (!socket.destroyed) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`[voice-https-proxy] listening on https://${LISTEN_HOST}:${LISTEN_PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
});
