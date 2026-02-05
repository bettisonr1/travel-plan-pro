const { StateGraph, START, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const { MongoDBSaver } = require("@langchain/langgraph-checkpoint-mongodb");
const { MongoClient } = require("mongodb");

const { 
  updatePointsOfInterest, 
  addUserToTrip, 
  postToMessageBoard, 
  startDeepResearch,
  addItineraryItem
} = require("./tools/chatTools");

// Also include basic trip tools if useful
const { searchTrips, createTrip, updateTrip } = require("./tools/tripTools");

// Combine tools
const tools = [
  updatePointsOfInterest, 
  addUserToTrip, 
  postToMessageBoard, 
  startDeepResearch,
  addItineraryItem,
  // searchTrips, // Maybe not needed for context of single trip chat
  // updateTrip // Could be useful
];

const toolsNode = new ToolNode(tools);

// Define the model
const model = new ChatOpenAI({ 
  model: "gpt-4o", 
  temperature: 0.5 
}).bindTools(tools);

// Define the agent node
const agentNode = async (state) => {
  const { messages } = state;
  const response = await model.invoke(messages);

  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log("[TripChatAgent] Model decided to call tools:", JSON.stringify(response.tool_calls, null, 2));
  } else {
    console.log("[TripChatAgent] Model did not call any tools.");
  }

  return { messages: [response] };
};

// Define conditional edge logic
const shouldContinue = (state) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return END;
};

// Create the graph
const workflow = new StateGraph({
  channels: {
    messages: {
      value: (x, y) => x.concat(y),
      default: () => []
    }
  }
})
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END
  })
  .addEdge("tools", "agent");

// Initialize checkpointer (shared client to be passed or created)
// We'll create a function to get the compiled graph to allow passing the client
const getTripChatAgent = (checkpointer) => {
  return workflow.compile({ checkpointer });
};

module.exports = { getTripChatAgent };
