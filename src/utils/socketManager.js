import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
  }

  initialize() {
    if (!this.socket) {
      // this.socket = io('http://localhost:3300');
      this.socket = io('http://192.168.0.104:3300');
      console.log('Socket initialized');
    }
    return this.socket;
  }

  getSocket() {
    return this.socket || this.initialize();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketManager(); 