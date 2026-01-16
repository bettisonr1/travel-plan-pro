const { Annotation, StateGraph, START, END, Send } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { z } = require("zod");

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

const ResearchState = Annotation.Root({
    categories: Annotation,
    destination: Annotation,
    research: Annotation({
        reducer: (x, y) => x.concat(y),
    }),
    summary: Annotation
});

const orchestrator = async (state) => {
    // The orchestrator logic is now handled in the conditional edge
    return {};
}

const runResearchers = (state) => {
    return state.categories.map((category) => {
        return new Send("researcher", {
            "category": category,
            "destination": state.destination
        })
    })
}

const researcher = async (state) => {
    const prompt = `
    You are an expert travel researcher tasked with researching ${state.destination} 
    with a specific focus on ${state.category}.
    
    Start your response with the category name as a markdown header (e.g., "### ${state.category}").
    Provide your findings in Markdown format. Do not wrap the output in JSON or code blocks.
    `;

    // We pass tags and metadata to help identify the stream events
    const response = await llm.invoke(
        prompt,
        { 
            tags: [state.category],
            metadata: { category: state.category }
        }
    );

    return { research: [response.content] };
}

const summariser = async (state) => {

    var formattedResearch = '';
    for (const work of state.research) {
        formattedResearch += "------\n";
        formattedResearch += work + "\n";
    }

    const prompt = `
    You are an AI tasked with summarising the travel research ${state.destination}.
    Previous agents have performed the specific research available in:
    ${formattedResearch}

    Provide the summary in Markdown format. Do not wrap the output in JSON or code blocks.
    `;

    const response = await llm.invoke(
        prompt,
        { 
            tags: ["summary"],
            metadata: { type: "summary" }
        }
    );
    
    return { summary: response.content }
}

const graphBuilder = new StateGraph(ResearchState)
    .addNode("orchestrator", orchestrator)
    .addNode("researcher", researcher)
    .addNode("summariser", summariser)
    .addEdge(START, "orchestrator")
    .addConditionalEdges("orchestrator", runResearchers, ["researcher"])
    .addEdge("researcher", "summariser")
    .addEdge("summariser", END);

const graph = graphBuilder.compile();

module.exports = { graph };
