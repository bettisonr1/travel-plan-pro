const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Trip = require("../../models/Trip");
const User = require("../../models/User");
const { startResearchJob } = require("../../services/ResearchService");

/**
 * Update or add points of interest for the trip.
 */
const updatePointsOfInterest = tool(
  async ({ tripId, pointsOfInterest }) => {
    console.log(`[updatePointsOfInterest] Invoked for tripId: ${tripId} with points:`, pointsOfInterest);
    try {
      const trip = await Trip.findByIdAndUpdate(
        tripId, 
        { $addToSet: { pointsOfInterest: { $each: pointsOfInterest } } },
        { new: true }
      );
      
      console.log(`[updatePointsOfInterest] Updated points of interest for trip ${tripId}`);
      return `Updated points of interest. Current list: ${trip.pointsOfInterest.join(", ")}.`;
    } catch (error) {
      console.error(`[updatePointsOfInterest] Error:`, error);
      return `Error updating points of interest: ${error.message}`;
    }
  },
  {
    name: "update_points_of_interest",
    description: "Update or add points of interest for the trip (e.g., 'Museums', 'Nightlife').",
    schema: z.object({
      tripId: z.string().describe("The unique MongoDB ID of the trip (e.g., '65a1b2c3d4e5f6...'). Do NOT use the trip name."),
      pointsOfInterest: z.array(z.string()).describe("List of points of interest to add")
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


/**
 * Add an item to the trip itinerary.
 */
const addItineraryItem = tool(
  async ({ tripId, title, description, location, date }) => {
    console.log(`[addItineraryItem] Invoked for tripId: ${tripId}, title: ${title}`);
    try {
      await Trip.findByIdAndUpdate(tripId, {
        $push: {
          itinerary: {
            title,
            description,
            location,
            date: date ? new Date(date) : null
          }
        }
      });
      return `Added "${title}" to the itinerary.`;
    } catch (error) {
      console.error(`[addItineraryItem] Error:`, error);
      return `Error adding item: ${error.message}`;
    }
  },
  {
    name: "add_itinerary_item",
    description: "Add a specific activity or item to the trip itinerary. Use this when the user accepts a suggestion or asks to add something to the schedule.",
    schema: z.object({
      tripId: z.string(),
      title: z.string().describe("Title of the activity"),
      description: z.string().optional(),
      location: z.string().optional(),
      date: z.string().optional().describe("Date of the activity (YYYY-MM-DD)")
    })
  }
);


module.exports = {
  updatePointsOfInterest,
  addUserToTrip,
  postToMessageBoard,
  startDeepResearch,
  addItineraryItem
};
