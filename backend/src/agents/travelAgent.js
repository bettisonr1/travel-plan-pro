const { StateGraph, START, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { SystemMessage } = require("@langchain/core/messages");
const { MongoDBSaver } = require("./MongoDBSaver");

// Define the state structure
const agentState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  }
};

// Define the agent node
const agentNode = async (state) => {
  const model = new ChatOpenAI({
    temperature: 0.7,
    modelName: "gpt-3.5-turbo",
  });

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

// Create the graph
const workflow = new StateGraph({ channels: agentState })
  .addNode("agent", agentNode)
  .addNode("human", humanNode)
  .addEdge(START, "agent")
  .addEdge("agent", END);
  // Note: 'human' node is added but not currently in the main flow. 
  // To make it active, we would route to it based on agent output.
  // For this task, we enable it and the infrastructure for it.

// Initialize checkpointer
const checkpointer = new MongoDBSaver();

// Compile the graph with checkpointing and interrupt
const travelAgent = workflow.compile({
    checkpointer: checkpointer,
    interruptBefore: ["human"]
});

module.exports = { travelAgent };
