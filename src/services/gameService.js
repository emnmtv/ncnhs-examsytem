import { io } from 'socket.io-client';
import { BASE_URL } from './authService';

// Create a socket connection to the game namespace
const baseUrl = BASE_URL.replace('/auth', '');
let socket = null;
let gameCallbacks = {};

/**
 * Initialize the game socket connection
 */
export const initGameSocket = () => {
  if (socket) return socket;
  
  // Connect to the game namespace
  socket = io(`${baseUrl}/game`, {
    transports: ['websocket'],
    autoConnect: true
  });
  
  // Set up event listeners
  socket.on('connect', () => {
    console.log('Connected to game server:', socket.id);
    if (gameCallbacks.onConnect) gameCallbacks.onConnect(socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from game server');
    if (gameCallbacks.onDisconnect) gameCallbacks.onDisconnect();
  });
  
  socket.on('playerJoined', (player) => {
    console.log('Player joined:', player);
    if (gameCallbacks.onPlayerJoined) gameCallbacks.onPlayerJoined(player);
  });
  
  socket.on('playerLeft', (playerId) => {
    console.log('Player left:', playerId);
    if (gameCallbacks.onPlayerLeft) gameCallbacks.onPlayerLeft(playerId);
  });
  
  socket.on('playerMoved', (data) => {
    if (gameCallbacks.onPlayerMoved) gameCallbacks.onPlayerMoved(data);
  });
  
  socket.on('itemCollected', (data) => {
    console.log('Item collected:', data);
    if (gameCallbacks.onItemCollected) gameCallbacks.onItemCollected(data);
  });
  
  return socket;
};

/**
 * Set callback functions for game events
 */
export const setGameCallbacks = (callbacks) => {
  gameCallbacks = { ...gameCallbacks, ...callbacks };
};

/**
 * Create a new game room
 */
export const createGameRoom = (roomName) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not initialized'));
      return;
    }
    
    socket.emit('createRoom', roomName, (response) => {
      if (response.success) {
        resolve(response);
      } else {
        reject(new Error(response.error || 'Failed to create room'));
      }
    });
  });
};

/**
 * Get available game rooms
 */
export const getGameRooms = () => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not initialized'));
      return;
    }
    
    socket.emit('getRooms', (response) => {
      if (response.success) {
        resolve(response.rooms);
      } else {
        reject(new Error(response.error || 'Failed to get rooms'));
      }
    });
  });
};

/**
 * Join a game room
 */
export const joinGameRoom = (roomId, username) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not initialized'));
      return;
    }
    
    socket.emit('joinRoom', { roomId, username }, (response) => {
      if (response.success) {
        resolve(response);
      } else {
        reject(new Error(response.error || 'Failed to join room'));
      }
    });
  });
};

/**
 * Leave the current game room
 */
export const leaveGameRoom = () => {
  if (!socket) return;
  socket.emit('leaveRoom');
};

/**
 * Update player position
 */
export const updatePlayerPosition = (x, y) => {
  if (!socket) return;
  socket.emit('updatePosition', { x, y });
};

/**
 * Collect an item
 */
export const collectGameItem = (itemId) => {
  if (!socket) return;
  socket.emit('collectItem', itemId);
};

/**
 * Disconnect from the game server
 */
export const disconnectGameSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}; 