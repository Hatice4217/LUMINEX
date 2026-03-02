// Socket.IO Configuration - Real-time Features
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt-utils.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

let io;

// Online users set - userId -> socketId mapping
const onlineUsers = new Map();
// Socket ID -> User ID mapping
const socketUsers = new Map();

/**
 * Socket.IO sunucusunu başlat
 */
export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:8080',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'https://luminex-app-seven.vercel.app',
        'https://luminex-frontend.vercel.app',
        'https://luminex-app.vercel.app',
        /.+\.vercel\.app$/,
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);

      // Kullanıcıyı veritabanından al
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = socket.user;

    logger.info('User connected', { userId: user.id, socketId: socket.id });

    // Kullanıcıyı online users'a ekle
    onlineUsers.set(user.id, socket.id);
    socketUsers.set(socket.id, user.id);

    // Kullanıcı odasına katıl
    socket.join(`user:${user.id}`);

    // Rol bazlı odalara katıl
    socket.join(`role:${user.role}`);

    // User'ın online olduğunu bildir
    socket.broadcast.emit('user_online', {
      userId: user.id,
      timestamp: new Date(),
    });

    // Send online users list to the connected user
    socket.emit('online_users', {
      users: Array.from(onlineUsers.keys()),
    });

    /**
     * Send message event
     */
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message, subject } = data;

        if (!receiverId || !message) {
          socket.emit('error', { message: 'Receiver ID and message are required' });
          return;
        }

        // Mesajı veritabanına kaydet
        const savedMessage = await prisma.message.create({
          data: {
            senderId: user.id,
            receiverId,
            subject: subject || '',
            message,
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Alıcıya mesajı gönder
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', {
            message: savedMessage,
            timestamp: new Date(),
          });
        }

        // Göndericiye onay gönder
        socket.emit('message_sent', {
          messageId: savedMessage.id,
          timestamp: new Date(),
        });

        logger.info('Message sent via socket', { messageId: savedMessage.id, senderId: user.id, receiverId });
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator events
     */
    socket.on('typing_start', (data) => {
      const { receiverId } = data;

      if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user_typing', {
            userId: user.id,
            timestamp: new Date(),
          });
        }
      }
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;

      if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user_stopped_typing', {
            userId: user.id,
            timestamp: new Date(),
          });
        }
      }
    });

    /**
     * Mark message as read
     */
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;

        await prisma.message.updateMany({
          where: {
            id: messageId,
            receiverId: user.id,
          },
          data: {
            isRead: true,
          },
        });

        // Göndericiye bildir
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { senderId: true },
        });

        if (message) {
          const senderSocketId = onlineUsers.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', {
              messageId,
              readBy: user.id,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        logger.error('Error marking message as read:', error);
      }
    });

    /**
     * Get online users
     */
    socket.on('get_online_users', () => {
      socket.emit('online_users', {
        users: Array.from(onlineUsers.keys()),
        count: onlineUsers.size,
      });
    });

    /**
     * Join appointment room
     */
    socket.on('join_appointment', (data) => {
      const { appointmentId } = data;

      if (appointmentId) {
        socket.join(`appointment:${appointmentId}`);
        logger.info('User joined appointment room', { userId: user.id, appointmentId });
      }
    });

    /**
     * Leave appointment room
     */
    socket.on('leave_appointment', (data) => {
      const { appointmentId } = data;

      if (appointmentId) {
        socket.leave(`appointment:${appointmentId}`);
        logger.info('User left appointment room', { userId: user.id, appointmentId });
      }
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      logger.info('User disconnected', { userId: user.id, socketId: socket.id });

      // Online users'tan sil
      onlineUsers.delete(user.id);
      socketUsers.delete(socket.id);

      // User'ın offline olduğunu bildir
      socket.broadcast.emit('user_offline', {
        userId: user.id,
        timestamp: new Date(),
      });
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('Socket.IO server initialized');

  return io;
}

/**
 * Belirli bir kullanıcıya notification gönder
 */
export function sendNotificationToUser(userId, notification) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  const socketId = onlineUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit('new_notification', {
      notification,
      timestamp: new Date(),
    });

    logger.info('Notification sent via socket', { userId, notificationId: notification.id });
    return true;
  }

  return false;
}

/**
 * Bir role bağlı tüm kullanıcılara mesaj broadcast et
 */
export function broadcastToRole(role, event, data) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date(),
  });

  logger.info('Broadcast to role', { role, event });
  return true;
}

/**
 * Randevu odasına güncelleme gönder
 */
export function sendAppointmentUpdate(appointmentId, update) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  io.to(`appointment:${appointmentId}`).emit('appointment_updated', {
    appointmentId,
    ...update,
    timestamp: new Date(),
  });

  logger.info('Appointment update sent', { appointmentId });
  return true;
}

/**
 * Online kullanıcıları getir
 */
export function getOnlineUsers() {
  return {
    users: Array.from(onlineUsers.keys()),
    count: onlineUsers.size,
  };
}

/**
 * Belirli bir kullanıcının online olup olmadığını kontrol et
 */
export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

/**
 * Socket.IO instance'ını getir
 */
export function getIO() {
  return io;
}

export default {
  initializeSocket,
  sendNotificationToUser,
  broadcastToRole,
  sendAppointmentUpdate,
  getOnlineUsers,
  isUserOnline,
  getIO,
};
