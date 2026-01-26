import operator
import os
from typing import Annotated, List, TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define the state
class TripResearchState(TypedDict):
    destination: str
    interests: List[str]
    research_results: Annotated[dict, operator.ior]  # Merges dictionaries from parallel nodes
    summary: str

# Initialize LLM
# Ensure OPENAI_API_KEY is set in .env
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# --- Nodes ---

def pre_research_agent(state: TripResearchState):
    """
    Clarifies what elements of the destination the user is interested in.
    If 'interests' is empty, it uses the LLM to suggest relevant categories 
    from the available list based on the destination.
    """
    print(f"--- Pre-Research Agent: Analyzing {state['destination']} ---")
    
    destination = state["destination"]
    available_categories = ["Culture", "Food", "Entertainment", "Activities", "Wildlife"]
    
    # If user already provided interests, we might filter them or just pass them through.
    # Here, if empty, we decide relevant ones.
    if not state.get("interests"):
        prompt = (
            f"You are a travel assistant. The user wants to go to {destination}. "
            f"Which of the following categories are most relevant for a trip to {destination}? "
            f"Categories: {', '.join(available_categories)}. "
            "Return ONLY a comma-separated list of the relevant categories from the provided list."
        )
        response = llm.invoke([HumanMessage(content=prompt)])
        suggested_interests = [i.strip() for i in response.content.split(",")]
        
        # Clean and validate
        final_interests = []
        for interest in suggested_interests:
            # Simple fuzzy match
            for cat in available_categories:
                if cat.lower() in interest.lower():
                    final_interests.append(cat)
                    break
        
        # Default to all if something went wrong or none matched
        if not final_interests:
            final_interests = available_categories
            
        print(f"Selected interests: {final_interests}")
        return {"interests": final_interests}
    
    print(f"User specified interests: {state['interests']}")
    return {"interests": state["interests"]}


def create_analyst_node(category: str):
    """Factory to create specific analyst agents."""
    def analyst_node(state: TripResearchState):
        print(f"--- {category} Analyst: Researching ---")
        destination = state["destination"]
        
        prompt = (
            f"You are an expert travel analyst specializing in {category}. "
            f"Provide a comprehensive but concise research summary for {category} in {destination}. "
            "Focus on top recommendations and unique experiences."
        )
        response = llm.invoke([HumanMessage(content=prompt)])
        
        return {"research_results": {category: response.content}}
    
    return analyst_node

def summarizing_agent(state: TripResearchState):
    """Aggregates all research results into a final summary."""
    print("--- Summarizing Agent: Compiling report ---")
    destination = state["destination"]
    results = state.get("research_results", {})
    
    prompt = f"Create a comprehensive travel guide summary for {destination} based on the following research:\n\n"
    for category, content in results.items():
        prompt += f"### {category}\n{content}\n\n"
    
    prompt += "Provide a cohesive narrative summary and a bulleted list of top recommendations."
    
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"summary": response.content}


# --- Workflow Setup ---

workflow = StateGraph(TripResearchState)

# Add nodes
workflow.add_node("pre_research", pre_research_agent)
workflow.add_node("summarizer", summarizing_agent)

# available categories
CATEGORIES = ["Culture", "Food", "Entertainment", "Activities", "Wildlife"]

# Add analyst nodes dynamically
for category in CATEGORIES:
    workflow.add_node(f"{category}_analyst", create_analyst_node(category))

# Set entry point
workflow.set_entry_point("pre_research")

# Define routing logic
def route_research(state: TripResearchState):
    interests = state["interests"]
    routes = []
    for interest in interests:
        # Match interest to category node
        for cat in CATEGORIES:
            if cat.lower() == interest.lower():
                 routes.append(f"{cat}_analyst")
    
    # Return list of nodes to run in parallel
    return routes

# Add conditional edges from pre_research to analysts
workflow.add_conditional_edges(
    "pre_research",
    route_research,
    [f"{cat}_analyst" for cat in CATEGORIES]
)

# Add edges from analysts to summarizer
for category in CATEGORIES:
    workflow.add_edge(f"{category}_analyst", "summarizer")

# End the workflow
workflow.add_edge("summarizer", END)

# Compile
app = workflow.compile()

# --- Execution (Example) ---
if __name__ == "__main__":
    # Example usage
    # Ensure you have OPENAI_API_KEY in .env
    
    print("Starting Trip Research Agent...")
    
    # Test case 1: No specific interests (Agent decides)
    inputs = {
        "destination": "Kyoto, Japan",
        "interests": [] 
    }
    
    try:
        result = app.invoke(inputs)
        print("\n\n################ FINAL SUMMARY ################\n")
        print(result["summary"])
    except Exception as e:
        print(f"Error executing workflow: {e}")
        print("Make sure OPENAI_API_KEY is set in agent/.env")
