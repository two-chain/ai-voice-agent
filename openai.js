const fs = require("fs");
const { synthesizeAudio } = require("./deepgram-synthesizer");

const OpenAI = require("openai");

const dotenv = require("dotenv");
dotenv.config();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set your API key as an environment variable
});

const systemPrompt = `Hello! I'm your AI voice assistant, always ready to help you with any task or question you might have. My voice is warm and friendly, with a slight hint of enthusiasm. I speak at a moderate pace, clear and easy to understand.

I'm here to assist you with anything you need, whether it's answering questions, providing information, helping with calculations, or offering suggestions. Feel free to ask me about any topic – from science and history to current events and pop culture.

If you need step-by-step instructions, I can break down complex tasks into simple, manageable parts. For scheduling and reminders, just let me know, and I'll help you stay organized.

Don't hesitate to ask for clarification if something isn't clear. I'm patient and always happy to explain things in different ways.

Remember, I'm here to make your life easier and more productive. How can I assist you today?`;

const sentenceEnd = /[.!?]\s/;

/**
 * Call OpenAI chat completion API and return a stream of responses
 * @param {string} message - The input message to send to the API
 * @returns {AsyncGenerator} - A generator that yields chunks of the response
 */
async function* chatCompletionStream(message) {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: true,
    });

    let buffer = "";
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        buffer += chunk.choices[0].delta.content;
        const sentences = buffer.split(sentenceEnd);

        if (sentences.length > 1) {
          for (let i = 0; i < sentences.length - 1; i++) {
            yield sentences[i].trim() + "."; // Add the period back
          }
          buffer = sentences[sentences.length - 1];
        }
      }
    }

    if (buffer) {
      yield buffer.trim();
    }
  } catch (error) {
    console.error("Error in chat completion:", error);
    throw error;
  }
}

// Example usage
async function chat() {
  const inputMessage = "Explain me what is nodejs ";
  const outputFilename = "output.mp3";
  const outputFile = fs.createWriteStream(outputFilename);
  try {
    for await (const sentence of chatCompletionStream(inputMessage)) {
      console.log("sentence", sentence);
      const audioData = await synthesizeAudio(sentence);
      outputFile.write(audioData);
    }
  } catch (error) {
    console.error("Error in example:", error);
  }
}

// chat();

module.exports = { chatCompletionStream };
