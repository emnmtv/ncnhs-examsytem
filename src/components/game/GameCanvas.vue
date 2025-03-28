<template>
  <div class="game-container">
    <div v-if="!isInGame" class="game-lobby">
      <h2>2D Multiplayer Game</h2>
      
      <div class="username-input">
        <label for="username">Your Name:</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          placeholder="Enter your name"
          required
        >
      </div>
      
      <div class="lobby-actions">
        <button @click="showCreateRoom = true" class="create-room-btn">
          Create Room
        </button>
        <button @click="refreshRooms" class="refresh-btn">
          <span class="material-icons">refresh</span>
          Refresh Rooms
        </button>
      </div>
      
      <div v-if="loadingRooms" class="loading-rooms">
        <span class="material-icons rotating">sync</span>
        Loading rooms...
      </div>
      
      <div v-else-if="rooms.length === 0" class="no-rooms">
        <p>No game rooms available. Create one to start playing!</p>
      </div>
      
      <div v-else class="rooms-list">
        <div v-for="room in rooms" :key="room.id" class="room-item">
          <div class="room-info">
            <h3>{{ room.name }}</h3>
            <span class="player-count">
              <span class="material-icons">people</span>
              {{ room.playerCount }} players
            </span>
          </div>
          <button @click="joinRoom(room.id)" class="join-btn">
            Join
          </button>
        </div>
      </div>
      
      <!-- Create Room Modal -->
      <div v-if="showCreateRoom" class="modal-overlay">
        <div class="modal-content">
          <h3>Create Game Room</h3>
          <div class="form-group">
            <label for="roomName">Room Name:</label>
            <input 
              type="text" 
              id="roomName" 
              v-model="newRoomName" 
              placeholder="Enter room name"
              required
            >
          </div>
          <div class="modal-actions">
            <button @click="showCreateRoom = false" class="cancel-btn">
              Cancel
            </button>
            <button @click="createRoom" class="create-btn">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="game-play">
      <div class="game-header">
        <div class="game-info">
          <h3>{{ currentRoom.name }}</h3>
          <div class="player-stats">
            <span class="score">Score: {{ playerScore }}</span>
            <span class="players-count">Players: {{ playersCount }}</span>
          </div>
        </div>
        <button @click="leaveGame" class="leave-btn">
          <span class="material-icons">exit_to_app</span>
          Leave Game
        </button>
      </div>
      
      <canvas 
        ref="gameCanvas" 
        width="800" 
        height="600"
        @mousemove="handleMouseMove"
        @click="handleClick"
      ></canvas>
      
      <div class="game-controls">
        <div class="controls-info">
          <p>Move: Mouse | Collect Items: Click</p>
        </div>
        <div class="players-list">
          <h4>Players</h4>
          <div v-for="player in players" :key="player.id" class="player-item">
            <div class="player-color" :style="{ backgroundColor: player.color }"></div>
            <span class="player-name">{{ player.username }}</span>
            <span class="player-score">{{ player.score }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  initGameSocket, 
  setGameCallbacks, 
  getGameRooms, 
  createGameRoom, 
  joinGameRoom, 
  leaveGameRoom, 
  updatePlayerPosition, 
  collectGameItem, 
  disconnectGameSocket 
} from '@/services/gameService';

// Game state
const isInGame = ref(false);
const username = ref('');
const rooms = ref([]);
const loadingRooms = ref(false);
const showCreateRoom = ref(false);
const newRoomName = ref('');
const currentRoom = ref({ id: '', name: '' });
const players = ref([]);
const gameObjects = ref([]);
const playerScore = ref(0);
const playerId = ref('');
const gameCanvas = ref(null);
const canvasContext = ref(null);

// Computed properties
const playersCount = computed(() => players.value.length);

// Game loop variables
let animationFrameId = null;
let lastRenderTime = 0;

// Initialize game
onMounted(() => {
  // Initialize socket connection
  initGameSocket();
  
  // Set up callbacks
  setGameCallbacks({
    onConnect: (id) => {
      playerId.value = id;
      refreshRooms();
    },
    onDisconnect: () => {
      isInGame.value = false;
      players.value = [];
      gameObjects.value = [];
    },
    onPlayerJoined: (player) => {
      players.value.push(player);
    },
    onPlayerLeft: (id) => {
      players.value = players.value.filter(p => p.id !== id);
    },
    onPlayerMoved: (data) => {
      const player = players.value.find(p => p.id === data.id);
      if (player) {
        player.x = data.x;
        player.y = data.y;
      }
    },
    onItemCollected: (data) => {
      // Remove collected item
      gameObjects.value = gameObjects.value.filter(obj => obj.id !== data.itemId);
      
      // Update player score
      const player = players.value.find(p => p.id === data.playerId);
      if (player) {
        player.score = data.newScore;
      }
      
      // Update local player score if it's us
      if (data.playerId === playerId.value) {
        playerScore.value = data.newScore;
      }
    }
  });
});

// Clean up on component unmount
onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  leaveGameRoom();
  disconnectGameSocket();
});

// Refresh available rooms
const refreshRooms = async () => {
  try {
    loadingRooms.value = true;
    rooms.value = await getGameRooms();
  } catch (error) {
    console.error('Error getting rooms:', error);
  } finally {
    loadingRooms.value = false;
  }
};

// Create a new room
const createRoom = async () => {
  if (!newRoomName.value || !username.value) {
    alert('Please enter both room name and your username');
    return;
  }
  
  try {
    const response = await createGameRoom(newRoomName.value);
    showCreateRoom.value = false;
    await joinRoom(response.roomId);
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Failed to create room: ' + error.message);
  }
};

// Join an existing room
const joinRoom = async (roomId) => {
  if (!username.value) {
    alert('Please enter your username');
    return;
  }
  
  try {
    const response = await joinGameRoom(roomId, username.value);
    
    // Set game state
    currentRoom.value = rooms.value.find(r => r.id === roomId) || { id: roomId, name: 'Game Room' };
    players.value = response.players;
    gameObjects.value = response.gameObjects;
    
    // Find our player to get initial score
    const myPlayer = players.value.find(p => p.id === playerId.value);
    if (myPlayer) {
      playerScore.value = myPlayer.score;
    }
    
    // Start the game
    isInGame.value = true;
    
    // Initialize canvas after DOM update
    setTimeout(() => {
      initCanvas();
      startGameLoop();
    }, 0);
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join room: ' + error.message);
  }
};

// Leave the current game
const leaveGame = () => {
  leaveGameRoom();
  isInGame.value = false;
  cancelAnimationFrame(animationFrameId);
  players.value = [];
  gameObjects.value = [];
  playerScore.value = 0;
  refreshRooms();
};

// Initialize the canvas
const initCanvas = () => {
  const canvas = gameCanvas.value;
  if (!canvas) return;
  
  canvasContext.value = canvas.getContext('2d');
  
  // Generate some random game objects (coins)
  for (let i = 0; i < 10; i++) {
    gameObjects.value.push({
      id: 'coin-' + i,
      type: 'coin',
      x: Math.random() * (canvas.width - 30),
      y: Math.random() * (canvas.height - 30),
      radius: 15,
      color: '#FFD700'
    });
  }
};

// Game rendering loop
const startGameLoop = () => {
  const gameLoop = (timestamp) => {
    // Calculate delta time
    if (!lastRenderTime) lastRenderTime = timestamp;
    lastRenderTime = timestamp;
    
    // Clear canvas
    const ctx = canvasContext.value;
    const canvas = gameCanvas.value;
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game objects (coins)
    gameObjects.value.forEach(obj => {
      if (obj.type === 'coin') {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        ctx.fillStyle = obj.color;
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }
    });
    
    // Draw players
    players.value.forEach(player => {
      // Draw player circle
      ctx.beginPath();
      ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
      
      // Draw player name
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(player.username, player.x, player.y - 30);
      
      // Draw player score
      ctx.font = '12px Arial';
      ctx.fillText(player.score.toString(), player.x, player.y + 30);
    });
    
    // Continue the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
  };
  
  // Start the loop
  animationFrameId = requestAnimationFrame(gameLoop);
};

// Handle mouse movement
const handleMouseMove = (event) => {
  if (!isInGame.value) return;
  
  const canvas = gameCanvas.value;
  if (!canvas) return;
  
  // Get canvas position
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Update local player position
  const player = players.value.find(p => p.id === playerId.value);
  if (player) {
    player.x = x;
    player.y = y;
  }
  
  // Send position update to server
  updatePlayerPosition(x, y);
};

// Handle click (collect items)
const handleClick = (event) => {
  if (!isInGame.value) return;
  
  const canvas = gameCanvas.value;
  if (!canvas) return;
  
  // Get canvas position
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Check if clicked on a coin
  const player = players.value.find(p => p.id === playerId.value);
  if (!player) return;
  
  // Calculate distance to each coin
  for (const obj of gameObjects.value) {
    if (obj.type === 'coin') {
      const distance = Math.sqrt(
        Math.pow(obj.x - x, 2) + Math.pow(obj.y - y, 2)
      );
      
      // If close enough to collect
      if (distance < obj.radius + 20) {
        collectGameItem(obj.id);
        break;
      }
    }
  }
};
</script>

<style scoped>
.game-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Lobby styles */
.game-lobby {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.game-lobby h2 {
  color: #159750;
  margin-bottom: 20px;
  text-align: center;
  font-size: 2rem;
}

.username-input {
  margin-bottom: 20px;
}

.username-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.username-input input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.lobby-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.create-room-btn,
.refresh-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.create-room-btn {
  background: #159750;
  color: white;
  flex: 1;
}

.refresh-btn {
  background: #f5f5f5;
  color: #333;
}

.loading-rooms,
.no-rooms {
  text-align: center;
  padding: 30px;
  color: #666;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rooms-list {
  margin-top: 20px;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
}

.room-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.player-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.9rem;
}

.join-btn {
  background: #159750;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin-top: 0;
  color: #159750;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn,
.create-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.create-btn {
  background: #159750;
  color: white;
}

/* Game play styles */
.game-play {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.game-info h3 {
  margin: 0 0 5px 0;
  color: #159750;
}

.player-stats {
  display: flex;
  gap: 15px;
  color: #666;
}

.leave-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

canvas {
  display: block;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f0f0f0;
}

.game-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.controls-info {
  color: #666;
  font-size: 0.9rem;
}

.players-list {
  background: #f5f5f5;
  padding: 10px 15px;
  border-radius: 8px;
  min-width: 200px;
}

.players-list h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.player-color {
  width: 15px;
  height: 15px;
  border-radius: 50%;
}

.player-name {
  flex: 1;
}

.player-score {
  font-weight: 500;
}
</style> 