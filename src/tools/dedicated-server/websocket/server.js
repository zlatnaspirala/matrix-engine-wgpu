#!/usr/bin/env node
'use strict';

/**
 * Minimal multi-room WebRTC signaling server.
 *
 * Run:
 *   npm install
 *   node src/tools/dedicated-server/websocket/server.js
 *
 * Optional environment:
 *   PORT=8081 HOST=0.0.0.0 MAX_PEERS_PER_ROOM=32 node ...
 *
 * This server only exchanges signaling messages. Media/data travel peer-to-peer.
 * Put it behind HTTPS/WSS (TLS reverse proxy) for production deployments.
 */
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = Number(process.env.PORT || 2020);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PEERS_PER_ROOM = Math.max(2, Number(process.env.MAX_PEERS_PER_ROOM || 32));
const MAX_MESSAGE_BYTES = 1024 * 1024;
const rooms = new Map();
const clients = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'matrix-engine-webrtc-signaling', rooms: rooms.size, peers: clients.size }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server, maxPayload: MAX_MESSAGE_BYTES });

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function broadcast(room, payload, exceptId) {
  for (const [id, peer] of room) if (id !== exceptId) send(peer.socket, payload);
}

function leave(socket) {
  const client = clients.get(socket);
  if (!client) return;
  clients.delete(socket);
  const room = rooms.get(client.room);
  if (room) {
    room.delete(client.id);
    broadcast(room, { type: 'peer-left', id: client.id });
    if (!room.size) rooms.delete(client.room);
  }
  socket.roomClient = null;
}

wss.on('connection', socket => {
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });
  socket.on('message', raw => {
    let message;
    try { message = JSON.parse(raw.toString()); }
    catch (_) { return send(socket, { type: 'error', error: 'invalid-json' }); }

    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'join') {
      if (socket.roomClient) return send(socket, { type: 'error', error: 'already-joined' });
      const roomName = String(message.room || '').trim().slice(0, 128);
      if (!roomName) return send(socket, { type: 'error', error: 'room-required' });
      let room = rooms.get(roomName);
      if (!room) rooms.set(roomName, room = new Map());
      if (room.size >= MAX_PEERS_PER_ROOM) return send(socket, { type: 'error', error: 'room-full' });
      const id = randomUUID();
      const existing = Array.from(room.keys());
      const client = { id, room: roomName, socket, metadata: message.metadata || null };
      room.set(id, client);
      clients.set(socket, client);
      socket.roomClient = client;
      send(socket, { type: 'joined', id, room: roomName, peers: existing.map(peerId => ({ id: peerId })) });
      broadcast(room, { type: 'peer-joined', id }, id);
      return;
    }

    const client = clients.get(socket);
    if (!client) return send(socket, { type: 'error', error: 'join-first' });
    if (message.type === 'leave') return leave(socket);
    const allowed = new Set(['offer', 'answer', 'ice-candidate']);
    if (!allowed.has(message.type)) return send(socket, { type: 'error', error: 'unsupported-message' });
    const target = rooms.get(client.room)?.get(String(message.to || ''));
    if (!target) return send(socket, { type: 'error', error: 'peer-not-found', to: message.to });
    const relay = { ...message, from: client.id };
    delete relay.room;
    send(target.socket, relay);
  });

  socket.on('close', () => leave(socket));
  socket.on('error', () => leave(socket));
});

const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.isAlive === false) { socket.terminate(); continue; }
    socket.isAlive = false;
    socket.ping();
  }
}, 30000);

server.listen(PORT, HOST, () => {
  console.log('[matrix-engine-webrtc] signaling server listening on ws://' + HOST + ':' + PORT);
});

function shutdown() {
  clearInterval(heartbeat);
  for (const socket of wss.clients) socket.close(1001, 'server-shutdown');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
