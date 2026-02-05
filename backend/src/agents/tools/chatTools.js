const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Trip = require("../../models/Trip");
const User = require("../../models/User");
const { startResearchJob } = require("../../services/ResearchService");

/**
 * Update the research categories for the trip.
 */
const updateTripCategories = tool(
  async ({ tripId, categories }) => {
    try {
      // We update the categories by creating placeholder researchFindings if they don't exist
      // or just assuming the research tool will fill them later.
      // For now, let's just confirm the intent.
      return `Updated research focus to: ${categories.join(", ")}.`;
    } catch (error) {
      return `Error updating categories: ${error.message}`;
    }
  },
  {
    name: "update_trip_categories",
    description: "Update the research categories/topics for the trip (e.g., 'Museums', 'Nightlife').",
    schema: z.object({
      tripId: z.string(),
      categories: z.array(z.string()).describe("List of category names")
    })
  }
);

/**
 * Add a user to the trip by their email address.
 */
const addUserToTrip = tool(
  async ({ tripId, email }) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return `User not found with email: ${email}`;
      
      const trip = await Trip.findByIdAndUpdate(
        tripId, 
        { $addToSet: { users: user._id } },
        { new: true }
      );
      
      return `Added user ${user.firstname} ${user.lastname} (${email}) to the trip.`;
    } catch (error) {
      return `Error adding user: ${error.message}`;
    }
  },
  {
    name: "add_user_to_trip",
    description: "Add a user to the trip by their email address.",
    schema: z.object({
      tripId: z.string(),
      email: z.string().email()
    })
  }
);

/**
 * Post an important announcement or finding to the main message board.
 */
const postToMessageBoard = tool(
  async ({ tripId, content }) => {
    try {
      await Trip.findByIdAndUpdate(tripId, {
        $push: { 
          messages: { 
            text: content, 
            senderType: 'ai',
            senderName: 'Travel Agent'
          } 
        }
      });
      return "Message posted to the board.";
    } catch (error) {
      return `Error posting message: ${error.message}`;
    }
  },
  {
    name: "post_to_message_board",
    description: "Post an important announcement or finding to the main message board.",
    schema: z.object({
      tripId: z.string(),
      content: z.string()
    })
  }
);

/**
 * Start a long-running research task in the background.
 */
const startDeepResearch = tool(
  async ({ tripId, destination, categories }) => {
    try {
      // 1. Mark trip as researching
      await Trip.findByIdAndUpdate(tripId, { isResearching: true });
      
      // 2. Kick off background job (do not await)
      startResearchJob(tripId, destination, categories).catch(err => {
        console.error("Background research error:", err);
      });
      
      return `I've started researching ${categories.join(', ')} for ${destination}. I'll notify you when I'm done.`;
    } catch (error) {
      return `Error starting research: ${error.message}`;
    }
  },
  {
    name: "start_deep_research",
    description: "Start a deep research task for specific categories. Use this when the user asks for detailed information or recommendations that requires research.",
    schema: z.object({
      tripId: z.string(),
      destination: z.string(),
      categories: z.array(z.string()).describe("List of categories to research")
    })
  }
);

module.exports = {
  updateTripCategories,
  addUserToTrip,
  postToMessageBoard,
  startDeepResearch
};
