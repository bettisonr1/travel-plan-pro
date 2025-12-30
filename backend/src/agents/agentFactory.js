const { StateGraph, START, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { SystemMessage, HumanMessage } = require("@langchain/core/messages");
const { z } = require("zod");

// Define the state schema
const researchState = {
  destination: {
    value: (x, y) => y,
    default: () => ""
  },
  description: {
    value: (x, y) => y,
    default: () => ""
  },
  categories: {
    value: (x, y) => y,
    default: () => []
  },
  findings: {
    value: (x, y) => x.concat(y),
    default: () => []
  },
  summary: {
    value: (x, y) => y,
    default: () => ""
  }
};

// Model initialization
const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: "gpt-4o", // Use a capable model for planning and research
});

// NODE 1: Planner
// Decides what categories to research based on the destination
const planResearch = async (state) => {
  const { destination, description } = state;
  console.log(`Planning research for: ${destination}`);

  const prompt = `You are a travel planning expert. 
  The user is going to "${destination}".
  Trip Description: "${description || 'No specific description provided.'}"

  Identify 3-5 distinct categories that would be important to research for a comprehensive trip plan, based on the destination and the description provided.
  Examples: "Local Cuisine", "Historical Sites", "Outdoor Activities", "Cultural Etiquette", "Transportation".
  
  Return ONLY a JSON array of strings, e.g., ["Cuisine", "History"]. Do not add markdown formatting.`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  
  let categories = [];
  try {
    // Clean up potential markdown code blocks
    const content = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
    categories = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse categories", e);
    // Fallback categories
    categories = ["Top Attractions", "Local Food", "Practical Tips"];
  }

  return { categories };
};

// NODE 2: Researcher (The "Expert Agent")
// This function will be called for each category
const conductResearch = async (state) => {
    // In a fan-out pattern, the state passed here might be the global state
    // But we need to know WHICH category to research.
    // We will implement the fan-out using conditional edges that map to this node multiple times
    // OR, better yet, we use a map-reduce style if LangGraph JS supports `Send` nicely.
    
    // However, to keep it simple and robust with standard StateGraph:
    // We can't easily iterate *inside* the graph structure without dynamic edges or `Send`.
    // Since we want to use the "creating an agent for each category" pattern, 
    // we effectively want to execute this node multiple times in parallel.
    
    // Implementation strategy:
    // The "research" node below actually expects a "category" to be passed in, 
    // but standard nodes receive the shared state.
    
    // We'll use the "Send" API pattern if possible, but let's look at how to structure this.
    // If we can't use `Send` easily in this JS version, we might iterate in the node, 
    // but that loses the "parallel agents" feel.
    
    // Let's assume we use `Send` logic in the conditional edge.
    // NOTE: In JS LangGraph, `Send` is available in recent versions.
    // Let's try to define a separate graph for the "Research" worker? 
    // Or just a node that we map over.
    
    // For now, let's implement the node logic assuming it receives a SINGLE category in a field,
    // or we'll simply do `Promise.all` inside a single node if map-reduce is too complex for this setup.
    // BUT the prompt asks for "agents will run in parallel".
    
    // Let's try to implement the mapping logic in the conditional edge (step 3).
    // The node itself:
    
    return {}; 
};

// Let's simplify. We will use a "ResearchManager" node that spins up promises.
// Although technically "agents", running them as `Promise.all` of LLM calls inside one node 
// satisfies "run in parallel" and is much easier to implement reliably in JS 
// without complex graph conditional logic if we aren't using the very latest `Send` API features perfectly.
//
// WAIT, the user explicitly asked for "workflow... start with an agent that will create an expert agent...".
// I should try to honor the structure.
//
// Let's define the "Expert Agent" as a function/node we call.

const researchCategory = async (category, destination) => {
    console.log(`Researching ${category} for ${destination}...`);
    const prompt = `You are an expert in ${category} for travel.
    Research the destination "${destination}" specifically focusing on "${category}".
    Provide 3-5 distinct, high-quality, actionable findings or recommendations.
    
    Format:
    ### ${category}
    - Finding 1
    - Finding 2
    ...
    `;

    const response = await model.invoke([new HumanMessage(prompt)]);
    return response.content;
};

const performParallelResearch = async (state) => {
    const { destination, categories } = state;
    
    // This node acts as the manager ensuring parallel execution
    const findingsPromises = categories.map(category => researchCategory(category, destination));
    const results = await Promise.all(findingsPromises);
    
    return { findings: results };
};

// NODE 3: Summarizer
const summarizeFindings = async (state) => {
    const { destination, findings } = state;
    console.log(`Summarizing findings for ${destination}`);
    
    const allFindingsText = findings.join("\n\n");
    
    const prompt = `You are a travel guide editor.
    We have gathered research on "${destination}" from various experts.
    
    Raw Findings:
    ${allFindingsText}
    
    Please compile a comprehensive, engaging summary of this trip destination. 
    Organize it neatly with markdown. 
    Highlight the most unique aspects found in the research.
    End with a "Traveler's Vibe" verdict (e.g., "Best for foodies", "Adventure awaits").`;

    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return { summary: response.content };
};


// Build the graph
const workflow = new StateGraph({ channels: researchState })
  .addNode("planner", planResearch)
  .addNode("researcher", performParallelResearch) // This node internally runs parallel agents
  .addNode("summarizer", summarizeFindings)
  .addEdge(START, "planner")
  .addEdge("planner", "researcher")
  .addEdge("researcher", "summarizer")
  .addEdge("summarizer", END);

const agentFactory = workflow.compile();

module.exports = { agentFactory };
