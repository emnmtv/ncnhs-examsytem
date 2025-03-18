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
    this.reconnectionInProgress = false;
    this.lastTestCode = null;

    // Set up page visibility handling
    this.setupPageVisibilityHandling();
  }

  initialize() {
    if (this.reconnectionInProgress) {
      console.log('Reconnection already in progress, waiting...');
      return this.socket;
    }

    this.reconnectionInProgress = true;

    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // If we already have a socket, clean it up properly
    if (this.socket) {
      console.log('Cleaning up existing socket before initialization');
      this.cleanupSocket();
    }

    console.log('Initializing new socket connection...');
    
    this.socket = io('http://192.168.0.104:3300', {
      path: '/socke.io',
      transports: ['websocket','polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      auth: {
        userId: localStorage.getItem('userId')
      }
    });

    // Set up connection handlers
    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket.id);
      this.reconnectionInProgress = false;
      
      // Automatically restore session state on reconnect
      this.restoreSession();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Don't attempt to reconnect for intentional disconnects
        return;
      }
      
      // Store the current state before disconnection
      this.lastTestCode = localStorage.getItem('testCode');
      
      // Attempt to reconnect
      setTimeout(() => {
        if (!this.socket.connected) {
          console.log('Attempting to reconnect...');
          this.initialize();
        }
      }, 1000);
    });

    return this.socket;
  }

  // New method to restore session state
  async restoreSession() {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const testCode = localStorage.getItem('testCode');

    if (!userId || !userRole) {
      console.log('No session to restore - missing user credentials');
      return;
    }

    console.log('Restoring session state...');

    // Make sure we have a connected socket
    if (!this.socket?.connected) {
      console.log('Socket not connected, initializing before restoring session');
      this.initialize();
      
      // Wait for connection before proceeding
      if (this.socket) {
        await new Promise(resolve => {
          const checkConnection = () => {
            if (this.socket.connected) {
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }
    }

    // First register the user
    this.emitUserLogin(userId, userRole);

    // If there was an active exam session, restore it
    if (testCode) {
      console.log('Restoring exam session:', testCode);
      setTimeout(() => {
        this.joinExam(testCode, userId);
      }, 500);
    }
  }

  cleanupSocket() {
    if (this.socket) {
      // Store current state before cleanup
      this.lastTestCode = localStorage.getItem('testCode');
      
      // Remove all listeners
      this.socket.removeAllListeners();
      
      // Disconnect the socket
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.socket = null;
    }
  }

  disconnect() {
    const userId = this.currentUserId;
    if (userId) {
      this.emitUserLogout(userId);
    }
    this.cleanupSocket();
    this.currentUserId = null;
    this.isInitializing = false;
    this.reconnectionInProgress = false;
  }

  // Modified joinExam method
  joinExam(testCode, userId) {
    if (!testCode || !userId) {
      console.error('Cannot join exam: missing testCode or userId');
      return;
    }

    console.log(`Joining exam ${testCode} as user ${userId}`);
    
    // Store test code for reconnection
    localStorage.setItem('testCode', testCode);
    this.lastTestCode = testCode;

    // Ensure we have a valid socket connection
    if (!this.socket?.connected) {
      console.log('Socket not connected, initializing...');
      this.initialize();
      
      // Wait for connection before joining
      this.socket.once('connect', () => {
        this.emitEvent('joinExam', { testCode, userId });
      });
      return;
    }

    this.emitEvent('joinExam', { testCode, userId });
  }

  // Modified quitExam method
  quitExam(testCode) {
    if (!testCode) {
      console.error('Cannot quit exam: missing testCode');
      return;
    }

    console.log(`Quitting exam ${testCode}`);
    
    // Clear stored test code
    localStorage.removeItem('testCode');
    this.lastTestCode = null;

    this.emitEvent('quitExam', { testCode });
  }

  getSocket() {
    return this.socket || this.initialize();
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

  // Add this method to the SocketManager class
  setupPageVisibilityHandling() {
    // Handle page visibility changes (tab switching, minimizing)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible - checking connection');
        if (!this.socket?.connected) {
          console.log('Socket disconnected while page was hidden - reconnecting');
          this.initialize();
        }
        
        // Always restore session when page becomes visible
        this.restoreSession();
      }
    });
    
    // Handle before unload to properly disconnect
    window.addEventListener('beforeunload', () => {
      console.log('Page unloading - storing session state');
      // We don't actually disconnect here, just store state
      this.lastTestCode = localStorage.getItem('testCode');
    });
    
    // Handle page load to restore session
    if (document.readyState === 'complete') {
      this.restoreSession();
    } else {
      window.addEventListener('load', () => {
        this.restoreSession();
      });
    }
  }
}

export default new SocketManager(); 