import { useState, useEffect } from 'react';
import { initSocket, disconnectSocket } from './utils/socket';
import { Copy, Share2, Maximize2, Minimize2, User, LogIn, Menu, X, MessageSquare, Users, LogOut, Pencil, Square, Circle, Eraser } from 'lucide-react';
import Whiteboard from './components/Whiteboard';
import Toolbar from './components/Toolbar';
import UsersPanel from './components/UsersPanel';
import Chat from './components/Chat';
import ColorPicker from './components/ColorPicker';

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [userColor, setUserColor] = useState('#007AFF');
  const [joined, setJoined] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('users'); // 'users' or 'chat'
  
  // Drawing state
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  
  // Initialize socket
  useEffect(() => {
    const newSocket = initSocket();
    setSocket(newSocket);
    
    // Check for room in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomId = urlParams.get('room');
    
    // Generate or use room ID from URL
    const randomRoomId = urlRoomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomRoomId);
    
    // Update URL with room ID
    if (!urlRoomId) {
      window.history.replaceState({}, '', `?room=${randomRoomId}`);
    }
    
    // Generate random username (placeholder)
    const adjectives = ['Creative', 'Artistic', 'Sketchy', 'Digital', 'Colorful'];
    const nouns = ['Artist', 'Designer', 'Creator', 'Sketch', 'Master'];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
    setUsername(randomName);
    
    // Generate random color
    const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];
    setUserColor(colors[Math.floor(Math.random() * colors.length)]);
    
    // Handle fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      disconnectSocket();
    };
  }, []);
  
  // Set up socket listeners
  useEffect(() => {
    if (!socket || !joined) return;
    
    const handleConnect = () => {
      console.log('✅ Connected to server with ID:', socket.id);
    };
    
    const handleRoomData = (data) => {
      console.log('📦 Room data received:', {
        drawings: data.drawings?.length || 0,
        users: data.users?.length || 0,
        messages: data.chat?.length || 0
      });
      setDrawings(data.drawings || []);
      setUsers(data.users || []);
      setChatMessages(data.chat || []);
    };
    
    const handleDrawing = (drawing) => {
      console.log('🎨 Drawing received:', drawing.tool);
      setDrawings(prev => [...prev, drawing]);
    };
    
    const handleUserJoined = (user) => {
      console.log('👤 User joined:', user.username);
      setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    };
    
    const handleUserLeft = (userId) => {
      console.log('👤 User left:', userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    };
    
    const handleUsersUpdated = (updatedUsers) => {
      console.log('👥 Users updated:', updatedUsers.length, 'users');
      setUsers(updatedUsers || []);
    };
    
    const handleCanvasCleared = () => {
      console.log('🧹 Canvas cleared');
      setDrawings([]);
    };
    
    const handleUndone = () => {
      console.log('↩️ Undo action');
      setDrawings(prev => prev.slice(0, -1));
    };
    
    const handleNewMessage = (message) => {
      console.log('💬 New message from:', message.username);
      setChatMessages(prev => [...prev, message]);
    };
    
    const handleCursorUpdated = ({ userId, cursor }) => {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, cursor } : user
      ));
    };
    
    const handleError = (error) => {
      console.error('❌ Socket error:', error);
    };
    
    // Connect event listeners
    socket.on('connect', handleConnect);
    socket.on('room-data', handleRoomData);
    socket.on('drawing', handleDrawing);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('users-updated', handleUsersUpdated);
    socket.on('canvas-cleared', handleCanvasCleared);
    socket.on('undone', handleUndone);
    socket.on('new-message', handleNewMessage);
    socket.on('cursor-updated', handleCursorUpdated);
    socket.on('error', handleError);
    
    // Auto-join room when socket is ready
    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }
    
    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('room-data', handleRoomData);
      socket.off('drawing', handleDrawing);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('users-updated', handleUsersUpdated);
      socket.off('canvas-cleared', handleCanvasCleared);
      socket.off('undone', handleUndone);
      socket.off('new-message', handleNewMessage);
      socket.off('cursor-updated', handleCursorUpdated);
      socket.off('error', handleError);
    };
  }, [socket, joined]);
  
  const joinRoom = () => {
    if (socket && roomId && username) {
      console.log('🚀 Joining room:', { roomId, username });
      socket.emit('join-room', {
        roomId,
        username,
        color: userColor
      });
      setJoined(true);
    }
  };
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setShowLogin(false);
      // Small delay to ensure UI updates before joining room
      setTimeout(() => {
        if (socket && socket.connected) {
          joinRoom();
        } else if (socket) {
          socket.once('connect', joinRoom);
        }
      }, 100);
    }
  };
  
  const handleLeaveRoom = () => {
    if (socket && joined) {
      if (window.confirm('Are you sure you want to leave this room?')) {
        socket.emit('leave-room', roomId);
        setJoined(false);
        setShowLogin(true);
        // Refresh to clean state
        window.location.reload();
      }
    }
  };
  
 const handleDraw = (points, drawColor, drawBrushSize, drawTool, text = '') => {
  if (socket && joined) {
    console.log('🖌️ Drawing:', { tool: drawTool, points: points.length, text });
    socket.emit('draw', {
      roomId,
      points,
      color: drawTool === 'eraser' ? '#FFFFFF' : drawColor,
      brushSize: drawBrushSize,
      tool: drawTool,
      text: drawTool === 'text' ? text : undefined
    });
  }
};
  
  const handleCursorMove = (x, y) => {
    if (socket && joined) {
      socket.emit('cursor-move', { roomId, x, y });
    }
  };
  
  const handleClearCanvas = () => {
    if (socket && joined) {
      if (window.confirm('Are you sure you want to clear the board for everyone?')) {
        socket.emit('clear-canvas', roomId);
      }
    }
  };
  
  const handleUndo = () => {
    if (socket && joined) {
      socket.emit('undo', roomId);
    }
  };
  
  const handleSendMessage = (message) => {
    if (socket && joined && message.trim()) {
      console.log('💬 Sending message:', message);
      socket.emit('send-message', { 
        roomId, 
        message: message.trim() 
      });
      return true;
    }
    return false;
  };
  
  const handleToolChange = (newTool) => {
    console.log('🛠️ Tool changed to:', newTool);
    setTool(newTool);
    setMobileMenuOpen(false); // Close mobile menu when tool is selected
  };
  
  const handleColorChange = (newColor) => {
    console.log('🎨 Color changed to:', newColor);
    setColor(newColor);
  };
  
  const handleSave = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `collaboard-${roomId}-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('🎉 Drawing saved successfully!');
    }
  };
  
  const handleShare = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('✅ Room link copied to clipboard!\nShare it with others to collaborate.');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Show login screen first
if (showLogin) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl mx-auto">
        <div className="w-full overflow-hidden bg-white border border-gray-200 shadow-2xl rounded-2xl">
          
          {/* Header - Compact */}
          <div className="p-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 md:p-5">
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="text-xl md:text-2xl">🎨</span>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold md:text-2xl">CollabBoard</h1>
                <p className="text-xs text-white/80 md:text-sm">Real-time Whiteboard Collaboration</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
              
              {/* Left Column - Compact Form */}
              <div className="space-y-4 md:space-y-5">
                <div>
                  <h2 className="flex items-center gap-2 mb-3 text-lg font-bold text-gray-800 md:text-xl">
                    <User className="w-5 h-5" />
                    Join Session
                  </h2>
                  
                  <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm md:text-base"
                        placeholder="Enter your name"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Your Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 border-2 border-white rounded-full shadow"
                          style={{ backgroundColor: userColor }}
                        />
                        <div className="flex-1">
                          <input
                            type="color"
                            value={userColor}
                            onChange={(e) => setUserColor(e.target.value)}
                            className="w-full h-8 rounded cursor-pointer bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile Join Button */}
                    <button
                      type="submit"
                      disabled={!username.trim()}
                      className="flex items-center justify-center w-full gap-2 py-3 font-medium text-white transition-all rounded-lg shadow md:hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Enter Room</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column - Compact Room Info */}
              <div className="space-y-4 md:space-y-5">
                {/* Room Card - More Compact */}
                <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 md:p-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                      <Copy className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-sm font-medium text-blue-800 md:text-base">Room Information</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 text-xs font-medium text-blue-700">Room ID</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded">
                              <code className="font-mono text-sm font-bold text-blue-800">
                                {roomId}
                              </code>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(roomId);
                                alert('Room ID copied!');
                              }}
                              className="p-2 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                              title="Copy Room ID"
                            >
                              <Copy className="w-3 h-3 text-blue-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - More Compact */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                      setRoomId(newRoomId);
                      window.history.replaceState({}, '', `?room=${newRoomId}`);
                      alert(`New Room: ${newRoomId}`);
                    }}
                    className="p-2.5 bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs md:text-sm"
                  >
                    <span className="text-lg">🔄</span>
                    <span>New Room</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}?room=${roomId}`;
                      navigator.clipboard.writeText(url).then(() => {
                        alert('Room link copied!');
                      });
                    }}
                    className="p-2.5 bg-white border border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs md:text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Desktop Join Button */}
                <button
                  onClick={handleLogin}
                  disabled={!username.trim()}
                  className="items-center justify-center hidden w-full gap-2 py-3 font-medium text-white transition-all rounded-lg shadow md:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Enter Collaboration Room</span>
                </button>
              </div>
            </div>

            {/* Features - Very Compact */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div className="flex flex-col items-center p-1">
                    <span className="text-sm">✏️</span>
                    <span>Real-time</span>
                  </div>
                  <div className="flex flex-col items-center p-1">
                    <span className="text-sm">👥</span>
                    <span>Multi-user</span>
                  </div>
                  <div className="flex flex-col items-center p-1">
                    <span className="text-sm">💬</span>
                    <span>Live Chat</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  By joining, you agree to collaborate respectfully
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  // Show loading screen while connecting
  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
              <span className="text-3xl">🎨</span>
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-800">Connecting to Room...</h2>
          <p className="mt-2 text-gray-600">Joining room: <span className="font-mono font-bold">{roomId}</span></p>
          <p className="mt-4 text-sm text-gray-500">As: <span className="font-medium">{username}</span></p>
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Establishing real-time connection</span>
          </div>
        </div>
      </div>
    );
  }
  
  
  // Main collaboration interface - FULLY RESPONSIVE
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header - Fixed Height */}
      <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-200 md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Room info & mobile menu */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg md:hidden hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600 md:text-sm">Live</span>
            </div>
            
            <div className="items-center hidden gap-2 md:flex">
              <span className="text-sm text-gray-600">Room:</span>
              <code className="px-2 py-1 font-mono text-sm text-gray-800 bg-gray-100 rounded">{roomId}</code>
            </div>
            
            <div className="hidden gap-2 md:flex">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 transition-colors rounded-lg md:gap-2 md:px-3 bg-blue-50 hover:bg-blue-100 md:text-sm"
              >
                <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 transition-colors bg-gray-100 rounded-lg md:gap-2 md:px-3 hover:bg-gray-200 md:text-sm"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </button>
            </div>
          </div>
          
          {/* Right side - User info with Leave button */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Leave button - Desktop */}
            <button
              onClick={handleLeaveRoom}
              className="items-center hidden gap-1 px-2 py-1 text-xs text-red-600 transition-colors rounded-lg md:flex md:gap-2 md:px-3 bg-red-50 hover:bg-red-100 md:text-sm"
              title="Leave Room"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
            
            <div className="text-right">
              {/* Show full username on mobile (removed truncation) */}
              <div className="text-xs font-medium text-gray-800 md:text-sm">
                {username}
              </div>
              <div className="text-xs text-gray-500">
                {users.length} online
              </div>
            </div>
            <div className="relative">
              <div
                className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full shadow"
                style={{ backgroundColor: userColor }}
                title={username}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute w-2 h-2 bg-green-500 border border-white rounded-full -top-1 -right-1"></div>
            </div>
            
            {/* Leave button - Mobile */}
            <button
              onClick={handleLeaveRoom}
              className="p-2 text-red-600 transition-colors rounded-lg md:hidden bg-red-50 hover:bg-red-100"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Mobile room info */}
        <div className="flex items-center justify-between mt-2 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Room:</span>
            <code className="px-2 py-1 font-mono text-xs text-gray-800 bg-gray-100 rounded">{roomId}</code>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleShare}
              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
              title="Share Room"
            >
              <Share2 className="w-3 h-3" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Flexible Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay (Tools) */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-50 md:hidden bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="absolute top-0 bottom-0 left-0 w-64 overflow-y-auto bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <h3 className="font-bold text-gray-800">Tools & Settings</h3>
              </div>
              <div className="p-4">
                <Toolbar
                  activeTool={tool}
                  onToolChange={handleToolChange}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                  onUndo={handleUndo}
                  onClear={handleClearCanvas}
                  onSave={handleSave}
                  onShare={handleShare}
                  userCount={users.length}
                  onLeave={handleLeaveRoom}
                />
                <div className="mt-4">
                  <ColorPicker
                    selectedColor={color}
                    onColorChange={handleColorChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col w-full h-full md:grid md:grid-cols-12">
          {/* Left Sidebar - Tools (Hidden on mobile, shown in overlay) */}
          <div className="flex-col hidden h-full gap-3 p-3 overflow-hidden md:flex md:col-span-2">
            <div className="flex-1 p-3 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow">
              <Toolbar
                activeTool={tool}
                onToolChange={handleToolChange}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                onUndo={handleUndo}
                onClear={handleClearCanvas}
                onSave={handleSave}
                onShare={handleShare}
                userCount={users.length}
                onLeave={handleLeaveRoom}
              />
            </div>
            
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow">
              <ColorPicker
                selectedColor={color}
                onColorChange={handleColorChange}
              />
            </div>
          </div>
          
          {/* Center - Whiteboard (Main Area) */}
          <div className="flex-1 h-full p-2 md:col-span-6 lg:col-span-5 md:p-3">
            <div className="h-full p-2 bg-white border border-gray-200 rounded-lg shadow">
              <div className="h-full overflow-hidden rounded">
                <Whiteboard
                  drawings={drawings}
                  onDraw={handleDraw}
                  tool={tool}
                  color={color}
                  brushSize={brushSize}
                  users={users}
                  onCursorMove={handleCursorMove}
                />
              </div>
            </div>
            
            {/* Mobile Quick Tools - FIXED VERSION */}
            <div className="p-2 mt-2 bg-white border border-gray-200 rounded-lg shadow md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {/* Pencil Tool */}
                  <button
                    onClick={() => handleToolChange('pencil')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      tool === 'pencil' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Pencil"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  
                  {/* Rectangle Tool */}
                  <button
                    onClick={() => handleToolChange('rectangle')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      tool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Rectangle"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  
                  {/* Circle Tool */}
                  <button
                    onClick={() => handleToolChange('circle')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      tool === 'circle' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Circle"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  
                  {/* Eraser Tool */}
                  <button
                    onClick={() => handleToolChange('eraser')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Eraser"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    className="p-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                    title="Undo"
                  >
                    ↩️
                  </button>
                  <button
                    onClick={handleClearCanvas}
                    className="p-2 text-red-600 transition-colors rounded-lg bg-red-50 hover:bg-red-100"
                    title="Clear Canvas"
                  >
                    🧹
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center flex-1 gap-2">
                  <div 
                    className="w-6 h-6 border border-gray-300 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-600 font-medium min-w-[40px] text-right">
                    {brushSize}px
                  </span>
                </div>
                {/* Color Picker Button for Mobile */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 ml-2 text-xs text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
                >
                  More Colors
                </button>
              </div>
              {/* Active Tool Indicator */}
              <div className="mt-1 text-xs text-center text-gray-500">
                Active: <span className="font-medium text-gray-700 capitalize">{tool}</span>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - Users & Chat (Desktop only) - INCREASED WIDTH */}
          <div className="flex-col hidden h-full gap-3 p-3 overflow-hidden md:flex md:col-span-4 lg:col-span-5">
            {/* Users Panel - Reduced height to give more space to chat */}
            <div className="flex-1 p-3 overflow-hidden bg-white border border-gray-200 rounded-lg shadow" style={{ flex: '1 1 30%' }}>
              <div className="h-full overflow-y-auto">
                <UsersPanel 
                  users={users} 
                  currentUserId={socket?.id} 
                />
              </div>
            </div>
            
            {/* Chat Panel - Increased height */}
            <div className="flex-1 p-3 overflow-hidden bg-white border border-gray-200 rounded-lg shadow" style={{ flex: '1 1 70%' }}>
              <div className="flex flex-col h-full">
                <Chat
                  messages={chatMessages}
                  currentUserId={socket?.id}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile Bottom Panel - Users & Chat - INCREASED HEIGHT */}
          <div className="md:hidden flex flex-col h-2/5 min-h-[250px] max-h-[350px] border-t border-gray-200 bg-white">
            {/* Tab Selector */}
            <div className="flex flex-shrink-0 border-b border-gray-200">
              <button
                onClick={() => setActiveMobileTab('users')}
                className={`flex-1 py-3 text-center flex items-center justify-center gap-2 ${
                  activeMobileTab === 'users' 
                    ? 'bg-white border-t-2 border-blue-500 text-blue-600' 
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users ({users.length})</span>
              </button>
              <button
                onClick={() => setActiveMobileTab('chat')}
                className={`flex-1 py-3 text-center flex items-center justify-center gap-2 ${
                  activeMobileTab === 'chat' 
                    ? 'bg-white border-t-2 border-blue-500 text-blue-600' 
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat ({chatMessages.length})</span>
              </button>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeMobileTab === 'users' ? (
                <div className="h-full p-3 overflow-y-auto">
                  <UsersPanel 
                    users={users} 
                    currentUserId={socket?.id} 
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <Chat
                    messages={chatMessages}
                    currentUserId={socket?.id}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - Fixed Height */}
      <div className="bg-white border-t border-gray-200 px-3 py-1.5 flex-shrink-0">
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-1 text-xs text-gray-600 md:gap-2">
            <span className="hidden sm:inline">🎨 Real-time drawing</span>
            <span className="sm:inline">•</span>
            <span>👥 {users.length} online</span>
            <span>•</span>
            <span className="hidden md:inline">💬 Chat enabled</span>
            <span className="hidden md:inline">•</span>
            <span className="font-mono text-xs">Room: {roomId}</span>
            {isFullscreen && (
              <>
                <span>•</span>
                <span className="text-green-600">🖥️ Fullscreen</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;