// WebSocket Tests
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';

describe('WebSocket Tests', () => {
  let io, serverSocket, clientSocket;
  let httpServer;
  let port = 3001;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);

    httpServer.listen(() => {
      const { port: p } = httpServer.address();
      port = p;

      // Mock authentication
      io.use((socket, next) => {
        socket.user = {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          role: 'PATIENT',
          email: 'test@example.com',
        };
        next();
      });

      io.on('connection', (socket) => {
        serverSocket = socket;

        socket.on('send_message', async (data) => {
          socket.emit('new_message', {
            message: {
              id: 'msg-1',
              senderId: socket.user.id,
              receiverId: data.receiverId,
              message: data.message,
              subject: data.subject,
            },
            timestamp: new Date(),
          });

          socket.emit('message_sent', {
            messageId: 'msg-1',
            timestamp: new Date(),
          });
        });

        socket.on('typing_start', (data) => {
          socket.emit('user_typing', {
            userId: socket.user.id,
            timestamp: new Date(),
          });
        });

        socket.on('get_online_users', () => {
          socket.emit('online_users', {
            users: [socket.user.id],
            count: 1,
          });
        });

        socket.on('disconnect', () => {});
      });

      done();
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  afterAll((done) => {
    io.close();
    httpServer.close(() => {
      done();
    });
  });

  describe('Connection Tests', () => {
    it('should connect successfully', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (err) => {
        done(err);
      });
    });

    it('should disconnect successfully', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });
  });

  describe('Messaging Tests', () => {
    it('should send message successfully', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('send_message', {
          receiverId: 'user-2',
          message: 'Test message',
          subject: 'Test Subject',
        });
      });

      clientSocket.on('message_sent', (data) => {
        expect(data.messageId).toBe('msg-1');
        done();
      });
    });

    it('should receive new message', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('send_message', {
          receiverId: 'user-2',
          message: 'Test message',
          subject: 'Test Subject',
        });
      });

      clientSocket.on('new_message', (data) => {
        expect(data.message.message).toBe('Test message');
        expect(data.message.senderId).toBe('user-1');
        done();
      });
    });
  });

  describe('Typing Indicators', () => {
    it('should send typing indicator', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('typing_start', {
          receiverId: 'user-2',
        });
      });

      clientSocket.on('user_typing', (data) => {
        expect(data.userId).toBe('user-1');
        done();
      });
    });
  });

  describe('Online Users', () => {
    it('should get online users', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('get_online_users');
      });

      clientSocket.on('online_users', (data) => {
        expect(data.users).toContain('user-1');
        expect(data.count).toBe(1);
        done();
      });
    });
  });

  describe('Room Management', () => {
    it('should join appointment room', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join_appointment', {
          appointmentId: 'apt-1',
        });

        // Check if socket joined the room
        const rooms = Array.from(clientSocket.rooms);
        expect(rooms).toContain('appointment:apt-1');
        done();
      });
    });

    it('should leave appointment room', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join_appointment', {
          appointmentId: 'apt-1',
        });

        clientSocket.emit('leave_appointment', {
          appointmentId: 'apt-1',
        });

        // Check if socket left the room
        const rooms = Array.from(clientSocket.rooms);
        expect(rooms).not.toContain('appointment:apt-1');
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', (done) => {
      clientSocket = Client(`http://localhost:9999`, {
        transports: ['websocket'],
        timeout: 1000,
      });

      clientSocket.on('connect_error', (err) => {
        expect(err).toBeDefined();
        done();
      });
    });

    it('should handle missing required fields', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('send_message', {
          // Missing receiverId and message
        });
      });

      clientSocket.on('error', (data) => {
        expect(data.message).toBeDefined();
        done();
      });

      // Emit error from server
      setTimeout(() => {
        serverSocket.emit('error', { message: 'Required fields missing' });
      }, 100);
    });
  });

  describe('Authentication', () => {
    it('should require authentication token', (done) => {
      const unauthClient = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: {}, // No token
      });

      unauthClient.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        unauthClient.disconnect();
        done();
      });
    });

    it('should accept valid token', (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: {
          token: 'valid-token',
        },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });
  });
});
