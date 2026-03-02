// Socket.IO Configuration
import { Server } from 'socket.io';

let io;

export function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:8080',
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
}

export function getIO() {
    return io;
}

// Send notification to specific user
export function sendNotificationToUser(userId, notification) {
    if (!io) return;

    io.to(`user-${userId}`).emit('notification', notification);
}

// Send appointment update
export function sendAppointmentUpdate(userId, appointment) {
    if (!io) return;

    io.to(`user-${userId}`).emit('appointmentUpdate', appointment);
}
