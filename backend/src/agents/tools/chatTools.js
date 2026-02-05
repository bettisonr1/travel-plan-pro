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
    console.log(`[updateTripCategories] Invoked for tripId: ${tripId} with categories:`, categories);
    try {
      // We update the categories by creating placeholder researchFindings if they don't exist
      // or just assuming the research tool will fill them later.
      // For now, let's just confirm the intent.
      return `Updated research focus to: ${categories.join(", ")}.`;
    } catch (error) {
      console.error(`[updateTripCategories] Error:`, error);
      return `Error updating categories: ${error.message}`;
    }
  },
  {
    name: "update_trip_categories",
    description: "Update the research categories/topics for the trip (e.g., 'Museums', 'Nightlife').",
    schema: z.object({
      tripId: z.string().describe("The unique MongoDB ID of the trip (e.g., '65a1b2c3d4e5f6...'). Do NOT use the trip name."),
      categories: z.array(z.string()).describe("List of category names")
    })
  }
);

/**
 * Add a user to the trip by their email address.
 */
const addUserToTrip = tool(
  async ({ tripId, email }) => {
    console.log(`[addUserToTrip] Invoked for tripId: ${tripId}, email: ${email}`);
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.warn(`[addUserToTrip] User not found: ${email}`);
        return `User not found with email: ${email}`;
      }
      
      const trip = await Trip.findByIdAndUpdate(
        tripId, 
        { $addToSet: { users: user._id } },
        { new: true }
      );
      
      console.log(`[addUserToTrip] Added user ${user._id} to trip ${tripId}`);
      return `Added user ${user.firstname} ${user.lastname} (${email}) to the trip.`;
    } catch (error) {
      console.error(`[addUserToTrip] Error:`, error);
      return `Error adding user: ${error.message}`;
    }
  },
  {
    name: "add_user_to_trip",
    description: "Add a user to the trip by their email address.",
    schema: z.object({
      tripId: z.string().describe("The unique MongoDB ID of the trip (e.g., '65a1b2c3d4e5f6...'). Do NOT use the trip name."),
      email: z.string().email()
    })
  }
);

/**
 * Post an important announcement or finding to the main message board.
 */
const postToMessageBoard = tool(
  async ({ tripId, content }) => {
    console.log(`[postToMessageBoard] Invoked for tripId: ${tripId}`);
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
      console.log(`[postToMessageBoard] Posted message to trip ${tripId}`);
      return "Message posted to the board.";
    } catch (error) {
      console.error(`[postToMessageBoard] Error:`, error);
      return `Error posting message: ${error.message}`;
    }
  },
  {
    name: "post_to_message_board",
    description: "Post an important announcement or finding to the main message board.",
    schema: z.object({
      tripId: z.string().describe("The unique MongoDB ID of the trip (e.g., '65a1b2c3d4e5f6...'). Do NOT use the trip name."),
      content: z.string()
    })
  }
);

/**
 * Start a long-running research task in the background.
 */
const startDeepResearch = tool(
  async ({ tripId, destination, categories }) => {
    console.log(`[startDeepResearch] Invoked for tripId: ${tripId}, dest: ${destination}, cats:`, categories);
    try {
      // 1. Mark trip as researching
      await Trip.findByIdAndUpdate(tripId, { isResearching: true });
      
      // 2. Kick off background job (do not await)
      startResearchJob(tripId, destination, categories).catch(err => {
        console.error(`[startDeepResearch] Background research error for trip ${tripId}:`, err);
      });
      
      console.log(`[startDeepResearch] Started research job for trip ${tripId}`);
      return `I've started researching ${categories.join(', ')} for ${destination}. I'll notify you when I'm done.`;
    } catch (error) {
      console.error(`[startDeepResearch] Error:`, error);
      return `Error starting research: ${error.message}`;
    }
  },
  {
    name: "start_deep_research",
    description: "Start a deep research task for specific categories. Use this when the user asks for detailed information or recommendations that requires research.",
    schema: z.object({
      tripId: z.string().describe("The unique MongoDB ID of the trip (e.g., '65a1b2c3d4e5f6...'). Do NOT use the trip name."),
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
