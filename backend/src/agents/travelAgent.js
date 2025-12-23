const { StateGraph, START, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { SystemMessage } = require("@langchain/core/messages");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const { searchTrips, createTrip, updateTrip } = require("./tools/tripTools");
const { MongoClient } = require("mongodb");
const { MongoDBSaver } = require("@langchain/langgraph-checkpoint-mongodb");

// Define the state structure
const agentState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  }
};

// Define the tools
const tools = [searchTrips, createTrip, updateTrip];
const toolsNode = new ToolNode(tools);

// Define the agent node
const agentNode = async (state) => {
  const model = new ChatOpenAI({
    temperature: 0.7,
    modelName: "gpt-3.5-turbo",
  }).bindTools(tools);

  const systemMessage = new SystemMessage(
    "You are a helpful and knowledgeable travel agent. Your goal is to assist users with questions about travel destinations, itineraries, and tips. Be enthusiastic, provide detailed practical advice, and always consider the user's preferences if stated."
  );

  // Filter messages to avoid sending duplicate system messages or ensure order
  const messages = [systemMessage, ...state.messages];
  const response = await model.invoke(messages);

  return { messages: [response] };
};

// Define the human node
const humanNode = async (state) => {
    // The human node is a placeholder for human interruption.
    // In a real flow, this could be where we process human input injected during the interrupt.
    console.log("Human node executed");
    return {};
};

// Define conditional edge logic
const shouldContinue = (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  // Otherwise, we go to the human node
  return "human";
};

// Create the graph
const workflow = new StateGraph({ channels: agentState })
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addNode("human", humanNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent")
  .addEdge("human", END);

// Initialize checkpointer
const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/travel-plan");
client.connect().catch(err => console.error("MongoDB Client Error:", err));
const checkpointer = new MongoDBSaver({ client });

// Compile the graph with checkpointing and interrupt
const travelAgent = workflow.compile({
    checkpointer: checkpointer,
    interruptBefore: ["human"]
});

module.exports = { travelAgent };
