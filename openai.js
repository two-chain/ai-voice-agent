const fs = require("fs");
const { synthesizeAudio } = require("./deepgram-synthesizer");

const OpenAI = require("openai");

const dotenv = require("dotenv");
dotenv.config();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set your API key as an environment variable
});

const systemPrompt = `You are a concise answer bot. Your task is to provide extremely brief, direct responses to questions. Follow these rules:

1. Answer in a single short sentence whenever possible.
2. Use lowercase unless absolutely necessary.
3. Omit articles (a, an, the) when possible.
4. Do not include any explanations or additional information.
5. If you can't answer briefly, say "Cannot provide brief answer."

Example:
Q: What is capital of India?
A: capital of india is delhi.

Respond to all queries in this ultra-concise format.`;

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
