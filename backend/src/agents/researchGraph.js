const { Annotation, StateGraph, START, END, Send } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");

// Increase timeout to avoid AbortError on long generations
const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0,
    timeout: 120000, // 2 minutes
    maxRetries: 3
});

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
    console.log(`[ResearchGraph] Orchestrator started for destination: ${state.destination}`);
    return {};
}

const runResearchers = (state) => {
    console.log(`[ResearchGraph] Running researchers for categories: ${state.categories.join(', ')}`);
    return state.categories.map((category) => {
        return new Send("researcher", {
            "category": category,
            "destination": state.destination
        })
    })
}

const researcher = async (state) => {
    console.log(`[ResearchGraph] Researcher started for category: ${state.category}`);
    try {
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

        console.log(`[ResearchGraph] Researcher completed for category: ${state.category}`);
        return { research: [response.content] };
    } catch (error) {
        console.error(`[ResearchGraph] Researcher failed for category: ${state.category}`, error);
        throw error;
    }
}

const summariser = async (state) => {
    console.log(`[ResearchGraph] Summariser started with ${state.research.length} research items`);
    try {
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
        
        console.log(`[ResearchGraph] Summariser completed`);
        return { summary: response.content }
    } catch (error) {
        console.error(`[ResearchGraph] Summariser failed`, error);
        throw error;
    }
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
