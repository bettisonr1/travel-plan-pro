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

    // Invoke the research graph
    const result = await graph.invoke(inputs);
    
    // Process results
    // result.research is array of strings (markdown)
    // result.summary is string
    
    const researchFindings = result.research.map((content, index) => ({
        category: categories[index] || "General",
        content: content
    }));

    // Update Trip
    const updatedTrip = await Trip.findByIdAndUpdate(tripId, {
      $set: {
        researchFindings: researchFindings,
        researchSummary: result.summary,
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

    // Notify via Socket
    try {
      const io = getIO();
      io.to(`trip_${tripId}`).emit('trip_data_updated', updatedTrip);
      io.to(`trip_${tripId}`).emit('new_message', {
        sender: 'ai',
        userName: 'Travel Agent',
        content: `Research complete for ${categories.join(', ')}! I've updated the Research tab with my findings.`
      });
    } catch (socketErr) {
      console.warn("Could not emit socket event:", socketErr.message);
    }

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
    } catch (e) {}
  }
};

module.exports = { startResearchJob };
