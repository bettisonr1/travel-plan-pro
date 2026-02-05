const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
const { MongoDBSaver } = require("@langchain/langgraph-checkpoint-mongodb");
const { getTripChatAgent } = require('./agents/tripChatAgent');
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { setIO } = require('./services/SocketService');
const Trip = require('./models/Trip');

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

// Set IO for services
setIO(io);

// Initialize Agent
const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/travel-plan");
let tripChatAgent;

async function initAgent() {
  try {
    await client.connect();
    const checkpointer = new MongoDBSaver({ client });
    tripChatAgent = getTripChatAgent(checkpointer);
    console.log("Trip Chat Agent initialized with MongoDB checkpointer");
  } catch (err) {
    console.error("Failed to initialize agent checkpointer:", err);
  }
}
initAgent();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_trip', (tripId) => {
    socket.join(`trip_${tripId}`);
    console.log(`Socket ${socket.id} joined trip_${tripId}`);
  });

  socket.on('chat_message', async (data) => {
    const { message, tripId, userName, userId } = data;
    const threadId = tripId; // Use tripId as threadId for persistence

    // 1. Broadcast user message to others immediately (Optimistic UI)
    socket.to(`trip_${threadId}`).emit('new_message', {
      sender: 'user',
      userName: userName,
      content: message
    });

    // 2. Save User Message to MongoDB (Trip Model) for persistence
    try {
        const msgData = {
            text: message,
            senderType: 'user',
            senderName: userName || 'Anonymous'
        };
        if (userId) msgData.user = userId;

        await Trip.findByIdAndUpdate(tripId, {
            $push: { messages: msgData }
        });
    } catch (err) {
        console.error("Error saving user message to DB:", err);
    }

    // 3. Invoke Agent
    if (!tripChatAgent) {
        socket.emit('agent_error', { message: "Agent system is starting up, please try again in a moment." });
        return;
    }

    try {
      // Get fresh trip data for context
      const trip = await Trip.findById(tripId);
      const context = `
      [Current Trip State]
      Destination: ${trip.destination}
      Research Status: ${trip.isResearching ? 'Research in progress' : 'Idle'}
      Existing Research Categories: ${trip.researchFindings.map(f => f.category).join(', ') || 'None'}
      `;

      const config = { configurable: { thread_id: threadId } };
      
      const response = await tripChatAgent.invoke(
        { 
            messages: [
                new SystemMessage(context),
                new HumanMessage({
                    content: message,
                    name: userName ? userName.replace(/[^a-zA-Z0-9_-]/g, '_') : undefined
                })
            ] 
        },
        config
      );

      const lastMessage = response.messages[response.messages.length - 1];
      
      // 4. Save AI Response to MongoDB
      await Trip.findByIdAndUpdate(tripId, {
        $push: {
            messages: {
                text: lastMessage.content,
                senderType: 'ai',
                senderName: 'Travel Agent'
            }
        }
      });

      // 5. Broadcast AI Response
      io.to(`trip_${threadId}`).emit('new_message', {
        sender: 'ai',
        userName: 'Travel Agent',
        content: lastMessage.content
      });

      // If tools were used that updated the trip, emit update event
      // (The tools themselves might emit, but we can also do it here if needed)
      
    } catch (error) {
      console.error("Error running agent:", error);
      socket.emit('agent_error', { message: "I encountered an error processing your request." });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
