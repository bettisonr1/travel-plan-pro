const { StateGraph, START, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { SystemMessage } = require("@langchain/core/messages");

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

  const messages = [systemMessage, ...state.messages];
  const response = await model.invoke(messages);

  return { messages: [response] };
};

// Create the graph
const workflow = new StateGraph({ channels: agentState })
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END);

// Compile the graph
const travelAgent = workflow.compile();

module.exports = { travelAgent };
