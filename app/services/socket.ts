import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../utils/token';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): Socket {
    const token = getAccessToken();
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('No access token found.');
    }

    if (!this.socket) {
      try {
        this.socket = io('https://project2-zphf.onrender.com', {
          auth: { token },
          autoConnect: true,
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('Socket connected successfully');
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

      } catch (error) {
        console.error('Failed to create socket connection:', error);
        throw error;
      }
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.disconnect();
        this.socket = null;
        console.log('Socket disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting socket:', error);
      }
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinRoom(roomId: string, userId: string, userName: string, userRole: string): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('joinClass', { classId: roomId, userId, userName, userRole });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('leaveRoom', roomId);
    }
  }

  sendMessage(event: string, data: unknown): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot send message.');
    }
  }

  onMessage(event: string, callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  offMessage(event: string, callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export default SocketService;