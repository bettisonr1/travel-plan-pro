import { AIMessageChunk, MessageStructure } from "@langchain/core/messages";
import {Annotation, StateGraph, 
    START, END, Send} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

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
    `;

    const schema = z.object({
        research: z.string().describe("The research findings for the category and destination.")
    });

    const structuredLlm = llm.withStructuredOutput(schema);
    const research = await structuredLlm.invoke(
        prompt.replace("{destination}", state.destination).replace("{category}", state.category)
    );

    return {research: [research.research]};
}

const summariser = async (state: typeof ResearchState.State) => {

    var formattedResearch = '';
    for (const work of state.research) {
        formattedResearch += "------";
        formattedResearch += work;
    }

    const prompt = `
    You are an AI tasked with summarising the travel research {state.destination}.
    Previous agents have performed the specific research available in {formattedResearch}
    `;

    const schema = z.object({
        summary: z.string().describe("The summary given the research findings.")
    });

    const structuredLlm = llm.withStructuredOutput(schema);
    const summary = await structuredLlm.invoke(
        prompt.replace("{destination}", state.destination).replace("{formattedResearch}", formattedResearch)
    );

    
    return {summary: summary}
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
