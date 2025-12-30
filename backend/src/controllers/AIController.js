const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const fs = require('fs');
const path = require('path');
const https = require('https');

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
    - "color": A hex color code (e.g., "#FF5733") that represents the vibe of the destination.
    
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
        endDate: result.endDate || endDate || '',
        color: result.color || '#3B82F6'
      }
    });

  } catch (error) {
    console.error("AI Suggestion Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate suggestions" });
  }
};

exports.generateTripImage = async (req, res) => {
  try {
    const { destination, description } = req.body;

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Destination is required' });
    }

    const prompt = `A beautiful, artistic travel poster style illustration of ${destination}. ${description ? `Vibe: ${description}.` : ''} High quality, vibrant colors, minimal text.`;

    await generateAndSaveImage(res, prompt, "trip");

  } catch (error) {
    console.error("Image Generation Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate image" });
  }
};

exports.generateLogo = async (req, res) => {
  try {
    const prompt = `A creative and artistic logo for a travel application named 'Travel Planner'. The text 'Travel Planner' must be clearly visible, legible, and integrated into the design. The design should be vibrant, modern, and travel-themed, incorporating elements like planes, globes, or suitcases. High quality, professional graphic design style.`;

    await generateAndSaveImage(res, prompt, "logo");

  } catch (error) {
    console.error("Logo Generation Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate logo" });
  }
};

// Helper function to handle OpenAI image generation and saving
async function generateAndSaveImage(res, prompt, prefix) {
    // 1. Call OpenAI API directly for Image Generation
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const imageUrl = data.data[0].url;

    // 2. Download and Save Image Locally
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const uploadDir = path.join(__dirname, '../../public/uploads');
    const filepath = path.join(uploadDir, filename);

    // Ensure directory exists (redundant check but safe)
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const file = fs.createWriteStream(filepath);

    https.get(imageUrl, function(response) {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        
        // 3. Return the local URL
        // We return the relative path that matches our express.static config
        const localUrl = `/uploads/${filename}`;
        
        res.status(200).json({
          success: true,
          imageUrl: localUrl
        });
      });
    }).on('error', function(err) {
      fs.unlink(filepath);
      console.error("Error downloading image:", err);
      res.status(500).json({ success: false, message: "Failed to save image" });
    });
}
