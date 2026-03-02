/**
 * LUMINEX Socket Client
 * Real-time communication with Socket.IO
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    // Event handlers
    this.handlers = {
      connect: [],
      disconnect: [],
      error: [],
      new_notification: [],
      new_message: [],
      message_sent: [],
      user_typing: [],
      user_stopped_typing: [],
      message_read: [],
      user_online: [],
      user_offline: [],
      online_users: [],
      appointment_updated: [],
    };
  }

  /**
   * Connect to the socket server
   * @param {string} token - JWT token for authentication
   */
  connect(token) {
    if (this.socket && this.isConnected) {
      console.warn('Socket already connected');
      return;
    }

    const serverUrl = localStorage.getItem('socketServerUrl') || 'http://localhost:3000';

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('error', { message: 'Connection failed', error });
      }
    });

    this.socket.on('new_notification', (data) => {
      console.log('New notification received:', data);
      this.emit('new_notification', data);

      // Show browser notification if permission granted
      this.showBrowserNotification(data.notification);
    });

    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      this.emit('new_message', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent:', data);
      this.emit('message_sent', data);
    });

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    this.socket.on('message_read', (data) => {
      this.emit('message_read', data);
    });

    this.socket.on('user_online', (data) => {
      console.log('User online:', data.userId);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('User offline:', data.userId);
      this.emit('user_offline', data);
    });

    this.socket.on('online_users', (data) => {
      console.log('Online users:', data);
      this.emit('online_users', data);
    });

    this.socket.on('appointment_updated', (data) => {
      console.log('Appointment updated:', data);
      this.emit('appointment_updated', data);
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
      this.emit('error', data);
    });
  }

  /**
   * Send a message to another user
   * @param {string} receiverId - Recipient user ID
   * @param {string} message - Message content
   * @param {string} subject - Message subject (optional)
   */
  sendMessage(receiverId, message, subject = '') {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('send_message', {
      receiverId,
      message,
      subject,
    });

    return true;
  }

  /**
   * Start typing indicator
   * @param {string} receiverId - Recipient user ID
   */
  startTyping(receiverId) {
    if (!this.isConnected) return false;

    this.socket.emit('typing_start', { receiverId });
    return true;
  }

  /**
   * Stop typing indicator
   * @param {string} receiverId - Recipient user ID
   */
  stopTyping(receiverId) {
    if (!this.isConnected) return false;

    this.socket.emit('typing_stop', { receiverId });
    return true;
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID to mark as read
   */
  markAsRead(messageId) {
    if (!this.isConnected) return false;

    this.socket.emit('mark_read', { messageId });
    return true;
  }

  /**
   * Join an appointment room
   * @param {string} appointmentId - Appointment ID
   */
  joinAppointment(appointmentId) {
    if (!this.isConnected) return false;

    this.socket.emit('join_appointment', { appointmentId });
    return true;
  }

  /**
   * Leave an appointment room
   * @param {string} appointmentId - Appointment ID
   */
  leaveAppointment(appointmentId) {
    if (!this.isConnected) return false;

    this.socket.emit('leave_appointment', { appointmentId });
    return true;
  }

  /**
   * Get online users
   */
  getOnlineUsers() {
    if (!this.isConnected) return false;

    this.socket.emit('get_online_users');
    return true;
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event].push(callback);
    } else {
      console.warn(`Unknown event: ${event}`);
    }
  }

  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to registered handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Show browser notification
   * @param {Object} notification - Notification data
   */
  async showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.message || 'Yeni Bildirim', {
        icon: '/favicon.ico',
        body: notification.type || '',
        tag: notification.id,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }
}

// Global socket client instance
const socketClient = new SocketClient();

// Auto-connect if token exists
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    socketClient.connect(token);
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = socketClient;
}
