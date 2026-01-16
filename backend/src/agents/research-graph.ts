import {Annotation, StateGraph, 
    START, END, Send} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({model: "gpt-4o", temperature: 0});

const ResearchState = Annotation.Root({
    categories: Annotation<string[]>,
    destination: Annotation<string>,
    research: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
    }),
    summary: Annotation<string>
});

export interface ResearchOutput {
    research: string;
}


const graphBuilder = new StateGraph(ResearchState);

const orchestrator = async (state: typeof ResearchState.State) => {
    // The orchestrator logic is now handled in the conditional edge
    return {};
}

const runResearchers = (state: typeof ResearchState.State) => {
    return state.categories.map((category) => {
        return new Send("researcher", {
            "category": category,
            "destination": state.destination
        })
    })
}

const researcher = async (state: {"category": string, "destination": string}) => {
    const prompt = `
    You are an expert travel researcher tasked with researching {destination} 
    with a specific focus on {category}.
    
    Start your response with the category name as a markdown header (e.g., "### {category}").
    Provide your findings in Markdown format. Do not wrap the output in JSON or code blocks.
    `;

    const response = await llm.invoke(
        prompt.replace("{destination}", state.destination).replace("{category}", state.category)
    );

    return {research: [response.content as string]};
}

const summariser = async (state: typeof ResearchState.State) => {

    var formattedResearch = '';
    for (const work of state.research) {
        formattedResearch += "------\n";
        formattedResearch += work;
        formattedResearch += "\n";
    }

    const prompt = `
    You are an AI tasked with summarising the travel research {state.destination}.
    Previous agents have performed the specific research available in {formattedResearch}

    Provide the summary in Markdown format. Do not wrap the output in JSON or code blocks.
    `;

    const response = await llm.invoke(
        prompt.replace("{destination}", state.destination).replace("{formattedResearch}", formattedResearch)
    );
    
    return {summary: response.content as string}
}

export const graph = graphBuilder
                .addNode("orchestrator", orchestrator)
                .addNode("researcher", researcher)
                .addNode("summariser", summariser)
                .addEdge(START, "orchestrator")
                .addConditionalEdges("orchestrator", runResearchers, ["researcher"])
                .addEdge("researcher", "summariser")
                .addEdge("summariser", END)
                .compile();
