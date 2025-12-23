const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Trip = require("../../models/Trip");

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
    description: "Search for existing trips by destination or description",
    schema: z.object({
      query: z.string().describe("The search term to find trips"),
    }),
  }
);

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
    description: "Create a new trip with destination, dates, and description",
    schema: z.object({
      destination: z.string().describe("The destination of the trip"),
      startDate: z.string().describe("The start date of the trip (YYYY-MM-DD)"),
      endDate: z.string().describe("The end date of the trip (YYYY-MM-DD)"),
      description: z.string().optional().describe("A description of the trip"),
      userId: z.string().optional().describe("The ID of the user creating the trip"),
    }),
  }
);

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
    description: "Update an existing trip's details",
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
