const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

const CATEGORIES = [
  'Adventure', 'Relaxation', 'Culture', 'Food & Drink', 
  'Nature', 'History', 'Shopping', 'Entertainment'
];

exports.suggestTripDetails = async (req, res) => {
  try {
    const { destination, description, startDate, endDate, freeformInput } = req.body;

    const model = new ChatOpenAI({
      temperature: 0.2, // Lower temperature for more deterministic output
      modelName: "gpt-4o-mini", // Using a cost-effective but capable model if available, otherwise gpt-3.5-turbo
    });

    const systemPrompt = `You are a travel assistant. 
Analyze the user's trip details and extract/refine information.

Allowed Categories: ${CATEGORIES.join(', ')}.

Return a JSON object with the following fields:
- "destination": The refined destination name (e.g., "Paris" -> "Paris, France").
- "description": A polished version of the user's description (keep it brief but engaging).
- "startDate": The start date in YYYY-MM-DD format if mentioned, otherwise null.
- "endDate": The end date in YYYY-MM-DD format if mentioned, otherwise null.
- "categories": An array of strings containing relevant categories from the Allowed Categories list based on the destination and description.

Output ONLY valid JSON.
`;

    let userPrompt;
    if (freeformInput) {
        userPrompt = `Trip Request: ${freeformInput}`;
    } else {
        userPrompt = `Destination: ${destination || "Not specified"}\nDescription: ${description || "Not specified"}\nDates: ${startDate} to ${endDate}`;
    }

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);

    let result;
    try {
        // clean potential markdown code blocks
        const cleanContent = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(cleanContent);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Raw Content:", response.content);
        return res.status(500).json({ success: false, message: "Failed to parse AI response" });
    }

    res.status(200).json({
      success: true,
      data: {
        destination: result.destination || destination,
        description: result.description || description,
        categories: result.categories || [],
        startDate: result.startDate || startDate || '',
        endDate: result.endDate || endDate || ''
      }
    });

  } catch (error) {
    console.error("AI Suggestion Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate suggestions" });
  }
};
