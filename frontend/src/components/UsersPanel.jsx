import { Users, User, Radio, Clock } from 'lucide-react';

const UsersPanel = ({ users, currentUserId }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="glass-card rounded-2xl p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5" />
        <h3 className="font-bold text-gray-800">Collaborators</h3>
        <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm">
          {users.length} online
        </span>
      </div>
      
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              user.id === currentUserId 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50'
            }`}
          >
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: user.color }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              {user.id === currentUserId && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.username}</span>
                {user.id === currentUserId && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">You</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Joined {formatTime(user.joinedAt)}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <Radio className="w-4 h-4 text-green-500" />
              <div className="text-xs text-gray-500 mt-1">Live</div>
            </div>
          </div>
        ))}
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No other users in this room</p>
          <p className="text-sm mt-1">Share the room link to collaborate</p>
        </div>
      )}
    </div>
  );
};

export default UsersPanel;