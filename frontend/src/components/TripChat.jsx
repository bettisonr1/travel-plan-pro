import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Button from './Button';
import ReactMarkdown from 'react-markdown';
import Card from './Card';

const TripChat = ({ tripId, currentUser, onTripUpdate, initialMessages = [], onResearchStream }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize Messages from props
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      // Transform mongo DB messages to chat format if needed
      const formatted = initialMessages.map(m => ({
        sender: m.senderType || 'user',
        content: m.text,
        userName: m.senderName,
        ...m
      }));
      setMessages(formatted);
    }
  }, [initialMessages]);

  // Initialize Socket
  useEffect(() => {
    // Determine API URL (handle dev vs prod)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const socketInstance = io(apiUrl);

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socketInstance.emit('join_trip', tripId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('new_message', (msg) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        // If we have a streaming message and this is the final AI message, replace it
        if (lastMsg && lastMsg._id === 'streaming-ai-msg' && msg.sender === 'ai') {
            return [...prev.slice(0, -1), msg];
        }
        return [...prev, msg];
      });
    });

    socketInstance.on('agent_thinking', () => {
      setMessages((prev) => [...prev, { 
        sender: 'ai', 
        userName: 'Travel Agent', 
        content: 'Thinking...', 
        isThinking: true,
        _id: 'streaming-ai-msg'
      }]);
    });

    socketInstance.on('agent_response_chunk', (data) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg._id === 'streaming-ai-msg') {
            const newContent = lastMsg.isThinking ? data.content : lastMsg.content + data.content;
            return [...prev.slice(0, -1), { 
                ...lastMsg, 
                content: newContent, 
                isThinking: false 
            }];
        }
        return prev;
      });
    });

    socketInstance.on('trip_data_updated', (updatedTrip) => {
      if (onTripUpdate) {
        onTripUpdate(updatedTrip); // Pass full object if available, or just trigger fetch
      }
    });

    socketInstance.on('agent_error', (err) => {
      setMessages((prev) => [...prev, { 
        sender: 'system', 
        content: `Error: ${err.message}`, 
        isError: true 
      }]);
    });

    socketInstance.on('research_stream', (data) => {
      if (onResearchStream) {
        onResearchStream(data);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [tripId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const msgData = {
      tripId,
      message: input,
      userName: currentUser?.firstname || 'User', // Use first name or fallback
      userId: currentUser?._id // If available
    };

    // Optimistically add message to UI
    setMessages((prev) => [...prev, {
      sender: 'user',
      content: input,
      userName: msgData.userName,
    }]);

    // Emit message
    socket.emit('chat_message', msgData);

    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800">Trip Assistant</h3>
          <p className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Connecting...'} • Collaborative Group Chat
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p>Start a conversation with the AI Agent and your group!</p>
            <p className="text-sm">Try "Research best vegan restaurants" or "Add John to the trip"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'user' && msg.userName === currentUser?.firstname;
          const isAI = msg.sender === 'ai';
          const isSystem = msg.sender === 'system';
          
          return (
            <div 
              key={idx} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : isAI 
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                      : isSystem
                        ? 'bg-red-50 text-red-600 border border-red-100 w-full text-center'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none' // Other users
                }`}
              >
                {!isMe && !isSystem && (
                  <div className={`text-xs font-bold mb-1 ${isAI ? 'text-blue-600' : 'text-gray-500'}`}>
                    {msg.userName || (isAI ? 'Travel Agent' : 'User')}
                  </div>
                )}
                
                <div className={`text-sm ${isMe ? 'text-blue-50' : 'text-gray-700'} markdown-content ${msg.isThinking ? 'animate-pulse italic opacity-75' : ''}`}>
                  {isAI ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent to research, update the trip, or chat..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            variant="primary" 
            disabled={!isConnected || !input.trim()}
            className="rounded-full px-6"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TripChat;
