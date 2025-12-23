import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const PlanMode = ({ onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Connect to WebSocket
  useEffect(() => {
    // Assuming backend is on port 5001 based on logs
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('agent_response', (data) => {
      setMessages((prev) => [...prev, { sender: 'agent', content: data.content }]);
    });

    socket.on('agent_error', (data) => {
      setMessages((prev) => [...prev, { sender: 'system', content: `Error: ${data.message}` }]);
    });

    return () => {
      socket.off('agent_response');
      socket.off('agent_error');
    };
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { sender: 'user', content: input }]);
    
    // Send to backend
    socket.emit('chat_message', { message: input });
    
    setInput('');
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <h2 className="text-xl font-bold">Plan Mode - AI Travel Agent</h2>
        <button 
          onClick={onClose}
          className="hover:bg-blue-700 p-2 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Hello! I'm your AI Travel Agent. Where would you like to go?</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-3xl p-4 rounded-lg shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : msg.sender === 'system'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about flights, hotels, or destinations..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlanMode;
