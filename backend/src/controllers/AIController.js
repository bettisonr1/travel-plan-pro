const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const fs = require('fs');
const path = require('path');
const https = require('https');
const { graph } = require('../agents/researchGraph');
const TripService = require('../services/TripService');
const StorageService = require('../services/StorageService');

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

exports.performDeepResearch = async (req, res) => {
  const { id } = req.params;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const trip = await TripService.getTripById(id);

    const inputs = {
      destination: trip.destination,
      categories: trip.pointsOfInterest || [], // Assuming pointsOfInterest are the categories
    };
    
    if (inputs.categories.length === 0) {
      // Default categories if none exist
      inputs.categories = ['General', 'Attractions', 'Food'];
    }

    const stream = await graph.streamEvents(inputs, {
        version: "v2"
    });

    // Accumulated results to save later
    let researchResults = [];
    let summaryResult = '';

    for await (const event of stream) {
      // Filter for LLM streaming events to send token by token
      if (event.event === "on_chat_model_stream") {
          const chunk = event.data.chunk;
          if (chunk && chunk.content) {
              // Extract category from metadata if available
              const category = event.metadata?.category;
              const isSummary = event.metadata?.type === 'summary' || (event.tags && event.tags.includes('summary'));
              
              res.write(`data: ${JSON.stringify({ 
                  type: 'token', 
                  content: chunk.content, 
                  node: event.metadata?.langgraph_node,
                  category: category,
                  isSummary: isSummary,
                  tags: event.tags || []
              })}\n\n`);
          }
      }
      
      // Keep existing logic for state updates (on_chain_end or on_node_end) to capture final results for DB
      if (event.event === "on_chain_end" && event.name === "researcher") {
          // event.data.output would be { research: [...] }
          if (event.data.output && event.data.output.research) {
             event.data.output.research.forEach(content => {
                 const match = content.match(/^###\s+(.*?)(\n|$)/);
                 const category = match ? match[1].trim() : 'General';
                 
                 // Update our accumulator
                 const existingIndex = researchResults.findIndex(r => r.category === category);
                 if (existingIndex >= 0) {
                     researchResults[existingIndex].content = content;
                 } else {
                     researchResults.push({ category, content });
                 }
             });
             
             // Send "complete" message for a node so UI knows to finalize
             res.write(`data: ${JSON.stringify({ 
                type: 'node_complete', 
                node: event.name,
                output: event.data.output
            })}\n\n`);
          }
      }

      if (event.event === "on_chain_end" && event.name === "summariser") {
          if (event.data.output && event.data.output.summary) {
              summaryResult = event.data.output.summary;
              
              res.write(`data: ${JSON.stringify({ 
                type: 'node_complete', 
                node: event.name,
                output: event.data.output
            })}\n\n`);
          }
      }
    }

    // Save to database
    await TripService.updateTrip(id, {
        researchFindings: researchResults,
        researchSummary: summaryResult
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in deep research:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
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

    // 2. Download and Upload to Azure Blob Storage
    https.get(imageUrl, function(response) {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          
          // Create file object compatible with StorageService
          const file = {
            originalname: `${prefix}.png`,
            buffer: buffer,
            mimetype: 'image/png'
          };

          const azureUrl = await StorageService.uploadImage(file);
          
          res.status(200).json({
            success: true,
            imageUrl: azureUrl
          });
        } catch (error) {
          console.error("Error uploading generated image:", error);
          res.status(500).json({ success: false, message: "Failed to upload generated image" });
        }
      });
    }).on('error', function(err) {
      console.error("Error downloading image from OpenAI:", err);
      res.status(500).json({ success: false, message: "Failed to process generated image" });
    });
}
