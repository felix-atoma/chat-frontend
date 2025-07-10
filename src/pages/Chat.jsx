import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import UserList from '../components/UserList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

export default function Chat() {
  const { socket, isConnected } = useSocket();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('user_join', user.username);
    socket.on('receive_message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('user_list', setUsers);
    socket.on('typing_users', setTypingUsers);

    return () => {
      socket.off('receive_message');
      socket.off('user_list');
      socket.off('typing_users');
    };
  }, [socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    const payload = activeUser
      ? { to: activeUser.id, message }
      : { message, timestamp: new Date().toISOString() };
    socket.emit(activeUser ? 'private_message' : 'send_message', payload);
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-900 shadow-xl flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Users</h2>
          <button onClick={toggleTheme} className="text-xs text-blue-500 underline hover:text-blue-700">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <UserList users={users} activeUser={activeUser} onSelectUser={setActiveUser} />
        </div>

        <div className="p-4 border-t text-center text-sm text-gray-600 dark:text-gray-300">
          Logged in as <span className="font-medium">{user?.username}</span>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 shadow-md border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {activeUser ? `Chatting with ${activeUser.username}` : 'Group Chat'}
          </h1>
          <button
            onClick={logout}
            className="text-sm bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <MessageList messages={messages} currentUserId={socket?.id} />
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-2 text-sm text-gray-500 dark:text-gray-300 italic">
            {typingUsers.join(', ')} is typing...
          </div>
        )}

        {/* Message Input */}
        <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={(isTyping) => socket.emit('typing', isTyping)}
          />
        </div>
      </div>
    </div>
  );
}
