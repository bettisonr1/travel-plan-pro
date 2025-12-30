import React, { useState } from 'react';
import Button from './Button';
import Card from './Card';
import authService from '../services/authService';

const MessageBoard = ({ tripId, messages, onMessagePosted, onMessageLiked }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = authService.getCurrentUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await onMessagePosted(newMessage);
      setNewMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLikedByMe = (message) => {
    if (!currentUser || !message.likes) return false;
    return message.likes.some(id => id === currentUser._id);
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[600px] pr-2">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg._id} className="flex space-x-3">
               <div 
                  className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: msg.user?.avatarColor || '#3B82F6' }}
                >
                  {msg.user?.firstname?.[0]}{msg.user?.lastname?.[0]}
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm text-gray-900">
                      {msg.user?.firstname} {msg.user?.lastname}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mt-1">{msg.text}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => onMessageLiked(msg._id)}
                      className={`text-sm flex items-center space-x-1 ${
                        isLikedByMe(msg) ? 'text-red-500 font-medium' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>{msg.likes?.length || 0}</span>
                    </button>
                  </div>
                </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting || !newMessage.trim()}>
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default MessageBoard;
