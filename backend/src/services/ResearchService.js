const { graph } = require("../agents/researchGraph");
const Trip = require("../models/Trip");
const { getIO } = require("./SocketService");

const startResearchJob = async (tripId, destination, categories) => {
  console.log(`[ResearchJob] Starting for Trip: ${tripId}, Dest: ${destination}, Cats: ${categories}`);
  
  try {
    const inputs = {
      destination,
      categories
    };

    const io = getIO();
    const room = `trip_${tripId}`;

    // Invoke the research graph with streaming
    const stream = await graph.streamEvents(inputs, {
        version: "v2"
    });

    // Accumulated results to save later
    let researchResults = [];
    let summaryResult = '';

    // Initialize/reset existing research findings in DB or just append?
    // For deep research, usually we might want to clear previous or append.
    // The previous implementation replaced them.
    // Let's stick to replacing for this specific "session" but maybe we should preserve?
    // The requirement implies "adding a suggestion", but here we are doing "research".
    // I'll stick to the previous behavior of updating the trip at the end, but streaming progress.

    for await (const event of stream) {
      // Filter for LLM streaming events to send token by token
      if (event.event === "on_chat_model_stream") {
          const chunk = event.data.chunk;
          if (chunk && chunk.content) {
              // Extract category from metadata if available
              const category = event.metadata?.category;
              const isSummary = event.metadata?.type === 'summary' || (event.tags && event.tags.includes('summary'));
              
              // Emit streaming event to frontend
              io.to(room).emit('research_stream', {
                  tripId,
                  type: 'token',
                  content: chunk.content,
                  category: category,
                  isSummary: isSummary
              });
          }
      }
      
      // Capture completed output for DB save
      if (event.event === "on_chain_end" && event.name === "researcher") {
          if (event.data.output && event.data.output.research) {
             event.data.output.research.forEach(content => {
                 const match = content.match(/^###\s+(.*?)(\n|$)/);
                 const category = match ? match[1].trim() : (event.metadata?.category || 'General');
                 
                 // Update our accumulator
                 const existingIndex = researchResults.findIndex(r => r.category === category);
                 if (existingIndex >= 0) {
                     researchResults[existingIndex].content = content;
                 } else {
                     researchResults.push({ category, content });
                 }
                 
                 // Emit completion for this node
                 io.to(room).emit('research_stream', {
                    tripId,
                    type: 'node_complete',
                    category: category,
                    content: content
                 });
             });
          }
      }

      if (event.event === "on_chain_end" && event.name === "summariser") {
          if (event.data.output && event.data.output.summary) {
              summaryResult = event.data.output.summary;
              
              io.to(room).emit('research_stream', {
                tripId,
                type: 'summary_complete',
                content: summaryResult
             });
          }
      }
    }
    
    // Process results for DB
    // If researchResults is empty (e.g. only summary?), check inputs
    if (researchResults.length === 0 && inputs.categories.length > 0) {
        // Fallback if event capturing failed?
        // Usually on_chain_end works.
    }

    // Update Trip
    const updatedTrip = await Trip.findByIdAndUpdate(tripId, {
      $set: {
        researchFindings: researchResults,
        researchSummary: summaryResult,
        isResearching: false
      },
      $push: {
        messages: {
          text: `Research complete for ${categories.join(', ')}! I've updated the Research tab with my findings.`,
          senderType: 'ai',
          senderName: 'Travel Agent'
        }
      }
    }, { new: true });

    // Notify via Socket (Standard update)
    io.to(room).emit('trip_data_updated', updatedTrip);
    io.to(room).emit('new_message', {
        sender: 'ai',
        userName: 'Travel Agent',
        content: `Research complete for ${categories.join(', ')}! I've updated the Research tab with my findings.`
    });

    console.log(`[ResearchJob] Completed for Trip: ${tripId}`);

  } catch (error) {
    console.error(`[ResearchJob] Failed for Trip ${tripId}:`, error);
    
    await Trip.findByIdAndUpdate(tripId, { 
      isResearching: false,
      $push: {
        messages: {
          text: `I encountered an error while researching: ${error.message}`,
          senderType: 'ai',
          senderName: 'Travel Agent'
        }
      }
    });
    
    try {
        const io = getIO();
        io.to(`trip_${tripId}`).emit('trip_data_updated');
        io.to(`trip_${tripId}`).emit('research_error', { message: error.message });
    } catch (e) {}
  }
};

module.exports = { startResearchJob };
