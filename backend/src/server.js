const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");
const { travelAgent } = require('./agents/travelAgent');
const { HumanMessage } = require("@langchain/core/messages");

// Connect to database
connectDB();

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat_message', async (data) => {
    const { message, threadId } = data;
    // Use provided threadId or socket.id
    const config = { configurable: { thread_id: threadId || socket.id } };

    try {
      const response = await travelAgent.invoke(
        { messages: [new HumanMessage(message)] },
        config
      );

      // Get the last message (Agent's response)
      const lastMessage = response.messages[response.messages.length - 1];
      
      socket.emit('agent_response', {
        content: lastMessage.content,
        threadId: config.configurable.thread_id
      });

    } catch (error) {
      console.error("Error running agent:", error);
      socket.emit('agent_error', { message: "I'm having trouble processing that." });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
