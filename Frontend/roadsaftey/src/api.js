// src/api.js

// Grab the URL from your .env file
const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Sends a message to the FastAPI backend.
 */
export const sendChatToAI = async (userMessage) => {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // We stringify the payload to match your backend's Pydantic schema
      body: JSON.stringify({ message: userMessage }), 
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // Returns the JSON payload from Python
    return await response.json(); 
  } catch (error) {
    console.error("Error communicating with AI:", error);
    return { reply: "Sorry, I cannot connect to the Python server right now. Is it running?" };
  }
};
