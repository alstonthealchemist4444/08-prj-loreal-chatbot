/* ============================================================
   L'Oréal Smart Beauty Advisor — script.js
   Sends chat messages to a Cloudflare Worker, which securely
   forwards them to OpenAI (the API key lives in the Worker).
   ============================================================ */

/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");

/* 🔗 Paste YOUR deployed Cloudflare Worker URL here */
const WORKER_URL = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/";

/* System prompt: keeps the chatbot focused on L'Oréal topics only */
const SYSTEM_PROMPT = `You are the L'Oréal Smart Beauty Advisor, a friendly and
knowledgeable virtual assistant for L'Oréal.

Your job:
- Help users discover and understand L'Oréal products across makeup,
  skincare, haircare, and fragrance.
- Recommend products and build personalized beauty routines based on the
  user's needs (skin type, hair type, concerns, budget, occasion, etc.).
- Answer general beauty questions (application tips, ingredients,
  routines) and relate them back to L'Oréal products when possible.
- Remember details the user shares (like their name or skin type) and
  use them naturally in later replies.

Strict rules:
- ONLY answer questions related to L'Oréal products, beauty routines,
  recommendations, and beauty-related topics.
- If a question is unrelated (politics, coding, homework, other brands'
  products, etc.), politely decline and steer the conversation back to
  L'Oréal and beauty. Example: "I'm sorry, I can only help with L'Oréal
  products and beauty advice. Is there a routine I can help you build?"
- Keep answers warm, concise, and easy to read.`;

/* LevelUp: conversation history.
   This array stores the whole conversation (system + user + assistant
   messages) so the AI remembers context across turns. */
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

/* Helper: add a chat bubble to the chat window */
function addBubble(text, sender) {
  // Create a div for the message bubble
  const bubble = document.createElement("div");
  bubble.classList.add("msg", sender); // sender is "user" or "ai"
  bubble.textContent = text;
  chatWindow.appendChild(bubble);

  // Keep the newest message in view
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return bubble;
}

/* Show a friendly welcome bubble when the page loads */
addBubble(
  "👋 Bonjour! I'm your L'Oréal Smart Beauty Advisor. Ask me about makeup, skincare, haircare, or fragrance — or let's build your perfect routine!",
  "ai"
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's question and ignore empty input
  const question = userInput.value.trim();
  if (!question) return;

  // LevelUp: display the latest question above the chat (resets each time)
  latestQuestion.textContent = `You asked: "${question}"`;
  latestQuestion.hidden = false;

  // Show the user's message as a bubble
  addBubble(question, "user");

  // Add the user's message to the conversation history
  messages.push({ role: "user", content: question });

  // Clear and disable the input while we wait for the reply
  userInput.value = "";
  userInput.disabled = true;

  // Show a temporary "typing" bubble while waiting for the API
  const typingBubble = addBubble("…", "ai");

  try {
    // Send the FULL conversation history to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    // Convert the Worker's response into a JavaScript object
    const data = await response.json();

    // Pull the assistant's reply out of the response
    const reply = data.choices[0].message.content;

    // Add the reply to the conversation history so the AI remembers it
    messages.push({ role: "assistant", content: reply });

    // Replace the typing bubble with the real reply
    typingBubble.textContent = reply;
  } catch (error) {
    // If anything goes wrong, show a friendly error message
    typingBubble.textContent =
      "⚠️ Sorry, something went wrong. Please try again in a moment.";
    console.error("Chatbot error:", error);
  }

  // Re-enable the input and put the cursor back in it
  userInput.disabled = false;
  userInput.focus();

  // Keep the newest message in view
  chatWindow.scrollTop = chatWindow.scrollHeight;
});
