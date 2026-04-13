/**
 * WebSocket Server for MCP Server
 * Handles real-time JIRA updates and webhook integration
 * Pure Node.js implementation
 */

const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');

class WebSocketServer extends EventEmitter {
  constructor(server, options = {}) {
    super();
    
    this.server = server;
    this.clients = new Map();
    this.rooms = new Map();
    this.config = {
      path: options.path || '/ws',
      heartbeatInterval: options.heartbeatInterval || 30000,
      maxPayloadSize: options.maxPayloadSize || 1024 * 1024, // 1MB
      perMessageDeflate: options.perMessageDeflate || false,
      clientTracking: options.clientTracking !== false
    };
    
    this.setupServer();
    this.startHeartbeat();
  }
  
  setupServer() {
    this.server.on('upgrade', (request, socket, head) => {
      if (request.url !== this.config.path) {
        socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
        return;
      }
      
      this.handleUpgrade(request, socket, head);
    });
  }
  
  handleUpgrade(request, socket, head) {
    const key = request.headers['sec-websocket-key'];
    const acceptKey = this.generateAcceptKey(key);
    
    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '', ''
    ].join('\r\n');
    
    socket.write(responseHeaders);
    
    const client = this.createClient(socket, request);
    this.handleClient(client);
  }
  
  generateAcceptKey(key) {
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    return crypto
      .createHash('sha1')
      .update(key + GUID)
      .digest('base64');
  }
  
  createClient(socket, request) {
    const clientId = crypto.randomBytes(16).toString('hex');
    const client = {
      id: clientId,
      socket,
      request,
      isAlive: true,
      rooms: new Set(),
      metadata: {},
      createdAt: Date.now()
    };
    
    if (this.config.clientTracking) {
      this.clients.set(clientId, client);
    }
    
    return client;
  }
  
  handleClient(client) {
    const { socket } = client;
    
    socket.on('data', (buffer) => {
      try {
        const frame = this.parseFrame(buffer);
        
        if (frame.opcode === 0x8) {
          // Close frame
          this.closeClient(client);
        } else if (frame.opcode === 0x9) {
          // Ping frame
          this.sendPong(client);
        } else if (frame.opcode === 0xA) {
          // Pong frame
          client.isAlive = true;
        } else if (frame.opcode === 0x1) {
          // Text frame
          const message = frame.payload.toString('utf8');
          this.handleMessage(client, message);
        }
      } catch (error) {
        console.error('WebSocket frame parsing error:', error);
        this.closeClient(client);
      }
    });
    
    socket.on('close', () => {
      this.closeClient(client);
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.closeClient(client);
    });
    
    // Send welcome message
    this.send(client, {
      type: 'connected',
      clientId: client.id,
      timestamp: Date.now()
    });
    
    this.emit('connection', client);
  }
  
  parseFrame(buffer) {
    let offset = 0;
    const frame = {};
    
    // Parse first byte
    const firstByte = buffer[offset++];
    frame.fin = !!(firstByte & 0x80);
    frame.opcode = firstByte & 0x0F;
    
    // Parse second byte
    const secondByte = buffer[offset++];
    frame.masked = !!(secondByte & 0x80);
    frame.payloadLength = secondByte & 0x7F;
    
    // Extended payload length
    if (frame.payloadLength === 126) {
      frame.payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (frame.payloadLength === 127) {
      frame.payloadLength = buffer.readBigUInt64BE(offset);
      offset += 8;
    }
    
    // Masking key
    if (frame.masked) {
      frame.maskingKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }
    
    // Payload
    frame.payload = buffer.slice(offset, offset + Number(frame.payloadLength));
    
    // Unmask payload if needed
    if (frame.masked) {
      for (let i = 0; i < frame.payload.length; i++) {
        frame.payload[i] ^= frame.maskingKey[i % 4];
      }
    }
    
    return frame;
  }
  
  createFrame(opcode, payload) {
    const payloadLength = payload.length;
    
    let frame;
    if (payloadLength < 126) {
      frame = Buffer.allocUnsafe(2);
      frame[0] = 0x80 | opcode; // FIN = 1
      frame[1] = payloadLength;
    } else if (payloadLength < 65536) {
      frame = Buffer.allocUnsafe(4);
      frame[0] = 0x80 | opcode;
      frame[1] = 126;
      frame.writeUInt16BE(payloadLength, 2);
    } else {
      frame = Buffer.allocUnsafe(10);
      frame[0] = 0x80 | opcode;
      frame[1] = 127;
      frame.writeBigUInt64BE(BigInt(payloadLength), 2);
    }
    
    return Buffer.concat([frame, payload]);
  }
  
  send(client, data) {
    if (!client.socket || client.socket.destroyed) return;
    
    try {
      const message = JSON.stringify(data);
      const payload = Buffer.from(message, 'utf8');
      const frame = this.createFrame(0x1, payload); // Text frame
      
      client.socket.write(frame);
    } catch (error) {
      console.error('WebSocket send error:', error);
    }
  }
  
  sendPing(client) {
    if (!client.socket || client.socket.destroyed) return;
    
    const frame = this.createFrame(0x9, Buffer.alloc(0)); // Ping frame
    client.socket.write(frame);
  }
  
  sendPong(client) {
    if (!client.socket || client.socket.destroyed) return;
    
    const frame = this.createFrame(0xA, Buffer.alloc(0)); // Pong frame
    client.socket.write(frame);
  }
  
  broadcast(data, excludeClient) {
    this.clients.forEach((client) => {
      if (client !== excludeClient) {
        this.send(client, data);
      }
    });
  }
  
  broadcastToRoom(room, data, excludeClient) {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;
    
    roomClients.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client !== excludeClient) {
        this.send(client, data);
      }
    });
  }
  
  joinRoom(client, room) {
    client.rooms.add(room);
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    
    this.rooms.get(room).add(client.id);
    
    // Notify room members
    this.broadcastToRoom(room, {
      type: 'room_joined',
      room,
      clientId: client.id,
      timestamp: Date.now()
    }, client);
  }
  
  leaveRoom(client, room) {
    client.rooms.delete(room);
    
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(client.id);
      
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      } else {
        // Notify remaining room members
        this.broadcastToRoom(room, {
          type: 'room_left',
          room,
          clientId: client.id,
          timestamp: Date.now()
        });
      }
    }
  }
  
  handleMessage(client, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_room':
          if (data.room) {
            this.joinRoom(client, data.room);
          }
          break;
          
        case 'leave_room':
          if (data.room) {
            this.leaveRoom(client, data.room);
          }
          break;
          
        case 'jira_subscribe':
          // Subscribe to JIRA project updates
          if (data.projectKey) {
            this.joinRoom(client, `jira:${data.projectKey}`);
          }
          break;
          
        case 'jira_unsubscribe':
          // Unsubscribe from JIRA project updates
          if (data.projectKey) {
            this.leaveRoom(client, `jira:${data.projectKey}`);
          }
          break;
          
        default:
          this.emit('message', client, data);
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
      this.send(client, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: Date.now()
      });
    }
  }
  
  closeClient(client) {
    if (!client.socket) return;
    
    // Leave all rooms
    client.rooms.forEach((room) => {
      this.leaveRoom(client, room);
    });
    
    // Remove from clients map
    if (this.config.clientTracking) {
      this.clients.delete(client.id);
    }
    
    // Close socket
    if (!client.socket.destroyed) {
      client.socket.end();
    }
    
    this.emit('close', client);
  }
  
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          this.closeClient(client);
        } else {
          client.isAlive = false;
          this.sendPing(client);
        }
      });
    }, this.config.heartbeatInterval);
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // JIRA webhook handler
  handleJiraWebhook(projectKey, event) {
    const room = `jira:${projectKey}`;
    
    this.broadcastToRoom(room, {
      type: 'jira_event',
      projectKey,
      event,
      timestamp: Date.now()
    });
  }
  
  // Get server statistics
  getStats() {
    const roomStats = {};
    this.rooms.forEach((clients, room) => {
      roomStats[room] = clients.size;
    });
    
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: roomStats,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }
  
  close() {
    this.stopHeartbeat();
    
    // Close all client connections
    this.clients.forEach((client) => {
      this.closeClient(client);
    });
    
    this.clients.clear();
    this.rooms.clear();
  }
}

// Factory function to create WebSocket server
function createWebSocketServer(httpServer, options) {
  return new WebSocketServer(httpServer, options);
}

module.exports = createWebSocketServer;
module.exports.WebSocketServer = WebSocketServer;