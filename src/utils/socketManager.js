import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.activeUsers = [];
    this.activeUsersCallbacks = [];
    this.isInitializing = false;
    this.pendingEvents = [];
    this.reconnectAttempts = 0;
    this.currentUserId = null;
    this.connectionTimeout = null;
  }

  initialize() {
    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // If we already have a connected socket, disconnect it first
    if (this.socket) {
      console.log('Cleaning up existing socket before initialization');
      this.disconnect();
    }

    if (this.isInitializing) {
      console.log('Socket already initializing, waiting...');
      return null;
    }
    
    this.isInitializing = true;
    console.log('Initializing socket connection...');
    
    this.socket = io('http://192.168.0.104:3300', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: localStorage.getItem('userId')
      },
      // Add these options to help prevent ghost connections
      forceNew: true,
      timeout: 5000
    });
    
    // Set up connection event handlers
    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket.id);
      this.isInitializing = false;
      
      // Clear any existing timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }
      
      // Re-register user on reconnect if we have their ID
      this.handleReconnect();
    });

    // Add a connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (!this.socket?.connected) {
        console.log('Connection timeout - forcing reconnect');
        this.disconnect();
        this.initialize();
      }
    }, 5000);

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.handleReconnect();
    });
    
    // Set up listener for active users updates
    this.socket.on('activeUsersUpdate', (users) => {
      console.log('Received active users update:', users);
      this.activeUsers = users;
      // Notify all callbacks
      this.activeUsersCallbacks.forEach(callback => callback(users));
    });
    
    return this.socket;
  }

  // Handle reconnection logic
  handleReconnect() {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (userId && userRole) {
      console.log(`Re-registering user ${userId} after reconnect`);
      
      // Add a small delay to ensure server has time to process any disconnect events
      setTimeout(() => {
        this.emitUserLogin(userId, userRole);
        
        // If user was in an exam, rejoin it
        const testCode = localStorage.getItem('testCode');
        if (testCode) {
          console.log(`Re-joining exam ${testCode} after reconnect`);
          this.joinExam(testCode, userId);
        }
      }, 500);
    }
  }

  getSocket() {
    return this.socket || this.initialize();
  }

  disconnect() {
    if (this.socket) {
      // Force disconnect and cleanup
      try {
        if (this.currentUserId) {
          this.emitUserLogout(this.currentUserId);
        }
        this.socket.disconnect(true);
        this.socket.close();
        this.socket = null;
        this.currentUserId = null;
        this.isInitializing = false;
      } catch (error) {
        console.error('Error during socket cleanup:', error);
      }
    }
  }

  // Emit an event with retry logic
  emitEvent(eventName, data, retries = 3) {
    const socket = this.getSocket();
    
    if (!socket) {
      console.warn(`Socket not available for event ${eventName}, queuing`);
      this.pendingEvents.push({ name: eventName, data });
      this.initialize();
      return;
    }
    
    if (!socket.connected) {
      console.warn(`Socket not connected for event ${eventName}, queuing`);
      this.pendingEvents.push({ name: eventName, data });
      return;
    }
    
    try {
      socket.emit(eventName, data);
      console.log(`Emitted ${eventName} event:`, data);
    } catch (error) {
      console.error(`Error emitting ${eventName} event:`, error);
      if (retries > 0) {
        console.log(`Retrying ${eventName} event (${retries} retries left)`);
        setTimeout(() => {
          this.emitEvent(eventName, data, retries - 1);
        }, 500);
      }
    }
  }

  // New method to notify server of user login
  emitUserLogin(userId, userRole) {
    if (!userId) return;
    
    // Ensure clean state before login
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log('Different user logging in - cleaning up previous session');
      this.disconnect();
      this.initialize();
    }
    
    this.currentUserId = userId;
    console.log(`Emitting userLogin event for user ${userId} (${userRole})`);
    this.emitEvent('userLogin', { userId, userRole });
  }

  // New method to notify server of user logout
  emitUserLogout(userId) {
    if (!userId) return;
    
    // Clear the current user ID
    this.currentUserId = null;
    
    console.log(`Emitting userLogout event for user ${userId}`);
    this.emitEvent('userLogout', { userId });
  }

  // New method to request active users list
  requestActiveUsers() {
    this.emitEvent('getActiveUsers', {});
  }

  // New method to send user activity heartbeat
  sendActivityHeartbeat(userId) {
    if (!userId) return;
    this.emitEvent('userActivity', { userId });
  }

  // New method to subscribe to active users updates
  onActiveUsersUpdate(callback) {
    this.activeUsersCallbacks.push(callback);
    return () => {
      this.activeUsersCallbacks = this.activeUsersCallbacks.filter(cb => cb !== callback);
    };
  }

  // New method to get current active users
  getActiveUsers() {
    return this.activeUsers;
  }

  // Add these methods for exam management
  joinExam(testCode, userId) {
    if (!testCode || !userId) {
      console.error('Cannot join exam: missing testCode or userId');
      return;
    }
    
    console.log(`Joining exam ${testCode} as user ${userId}`);
    
    // Store the test code in localStorage for reconnection
    localStorage.setItem('testCode', testCode);
    
    // Make sure we're still in the active users list
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      this.emitUserLogin(userId, userRole);
    }
    
    // Then join the exam
    this.emitEvent('joinExam', { testCode, userId });
  }

  quitExam(testCode) {
    if (!testCode) {
      console.error('Cannot quit exam: missing testCode');
      return;
    }
    
    const userId = localStorage.getItem('userId');
    console.log(`Quitting exam ${testCode} as user ${userId}`);
    
    // Remove the test code from localStorage
    localStorage.removeItem('testCode');
    
    // Quit the exam
    this.emitEvent('quitExam', { testCode });
    
    // Make sure we're still in the active users list
    if (userId) {
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        this.emitUserLogin(userId, userRole);
      }
      this.sendActivityHeartbeat(userId);
    }
  }
}

export default new SocketManager(); 