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
    `;

    const schema = z.object({
        research: z.string().describe("The research findings for the category and destination.")
    });

    // We pass tags and metadata to help identify the stream events
    const research = await structuredLlm.invoke(
        prompt,
        { 
            tags: [state.category],
            metadata: { category: state.category }
        }
    );

    // Return an object that matches the state update we want
    // Note: The original TS used {research: [research.research]}, but we need to capture category too ideally
    // for the UI. However, the reduce function just concatenates strings. 
    // To support the UI requirement "horizontal section containing different category generations",
    // we might want to structure the research output differently or rely on the fact that
    // we get stream events for each node.
    // For now I'll stick close to the original design but formatted for JS.
    
    return { research: [`### ${state.category}\n\n${research.research}`] };
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
    `;

    const schema = z.object({
        summary: z.string().describe("The summary given the research findings.")
    });

    const structuredLlm = llm.withStructuredOutput(schema);
    const summary = await structuredLlm.invoke(
        prompt,
        { 
            tags: ["summary"],
            metadata: { type: "summary" }
        }
    );

    
    return { summary: summary.summary }
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
