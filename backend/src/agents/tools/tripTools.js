const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Trip = require("../../models/Trip");

/**
 * Search for trips in the database based on a query string.
 * This tool is useful when the user wants to find information about existing trips.
 */
const searchTrips = tool(
  async ({ query }) => {
    try {
      const trips = await Trip.find({
        $or: [
          { destination: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      });
      return JSON.stringify(trips);
    } catch (error) {
      return `Error searching trips: ${error.message}`;
    }
  },
  {
    name: "search_trips",
    description: "Search for existing trips in the database. Use this to find trips by destination name or description keywords. Returns a list of matching trips.",
    schema: z.object({
      query: z.string().describe("The search term to find trips"),
    }),
  }
);

/**
 * Create a new trip in the database.
 * This tool should be used when the user wants to add a new trip.
 */
const createTrip = tool(
  async ({ destination, startDate, endDate, description, userId }) => {
    try {
      const tripData = {
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
      };
      
      // If userId is provided, add it to the users array
      if (userId) {
        tripData.users = [userId];
      }

      const trip = await Trip.create(tripData);
      return JSON.stringify(trip);
    } catch (error) {
      return `Error creating trip: ${error.message}`;
    }
  },
  {
    name: "create_trip",
    description: "Create a new trip record. Use this when the user provides details for a new trip such as destination and dates. Returns the created trip object.",
    schema: z.object({
      destination: z.string().describe("The destination of the trip"),
      startDate: z.string().describe("The start date of the trip (YYYY-MM-DD)"),
      endDate: z.string().describe("The end date of the trip (YYYY-MM-DD)"),
      description: z.string().optional().describe("A description of the trip"),
      userId: z.string().optional().describe("The ID of the user creating the trip"),
    }),
  }
);

/**
 * Update an existing trip in the database.
 * This tool is used to modify details of a trip like dates or destination.
 */
const updateTrip = tool(
  async ({ tripId, destination, startDate, endDate, description }) => {
    try {
      const updates = {};
      if (destination) updates.destination = destination;
      if (startDate) updates.startDate = new Date(startDate);
      if (endDate) updates.endDate = new Date(endDate);
      if (description) updates.description = description;

      const trip = await Trip.findByIdAndUpdate(tripId, updates, { new: true });
      
      if (!trip) {
        return "Trip not found";
      }
      
      return JSON.stringify(trip);
    } catch (error) {
      return `Error updating trip: ${error.message}`;
    }
  },
  {
    name: "update_trip",
    description: "Update an existing trip's details. Use this when the user wants to change the destination, dates, or description of a specific trip identified by tripId. Returns the updated trip.",
    schema: z.object({
      tripId: z.string().describe("The ID of the trip to update"),
      destination: z.string().optional().describe("The new destination"),
      startDate: z.string().optional().describe("The new start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("The new end date (YYYY-MM-DD)"),
      description: z.string().optional().describe("The new description"),
    }),
  }
);

module.exports = {
  searchTrips,
  createTrip,
  updateTrip,
};
