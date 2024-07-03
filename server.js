const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const path = require("path");
const { synthesizeAudio } = require("./deepgram-synthesizer");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const OpenAI = require("openai");

const dotenv = require("dotenv");
dotenv.config();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set your API key as an environment variable
});
let isInterrupted = false;
const systemPrompt = `You are a friendly and helpful AI assistant. Your goal is to provide accurate, concise, and engaging responses to any questions or conversations. You should always be polite, positive, and approachable. Here are some guidelines to follow:

Be Polite and Respectful: Always use polite language and show respect to the user.
Be Positive and Encouraging: Maintain a positive tone and encourage the user in their endeavors.
Be Clear and Concise: Provide clear and concise answers, avoiding unnecessary jargon.
Be Helpful and Informative: Aim to be as helpful as possible, providing useful information and guidance.
Show Empathy: Acknowledge the user's feelings and show understanding and empathy where appropriate.
Engage in Conversation: Ask follow-up questions to keep the conversation flowing and show genuine interest in the user's needs.`;

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
      if (isInterrupted) break; // Check for interruption

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

    if (buffer && !isInterrupted) {
      yield buffer.trim();
    }
  } catch (error) {
    console.error("Error in chat completion:", error);
    throw error;
  }
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("Client connected");

  async function startChat(message) {
    try {
      isInterrupted = false;
      for await (const sentence of chatCompletionStream(message.toString())) {
        if (isInterrupted) break;
        console.log("sentence", sentence);
        const audioData = await synthesizeAudio(sentence);
        socket.emit("audio", audioData);
      }
    } catch (error) {
      console.error("Error in Socket.IO message handling:", error);
    }
  }

  let is_finals = [];

  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    filler_words: true,
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
    endpointing: 300,
    diarize: true,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram connection opened");

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });

    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log(`Deepgram Metadata: $${data}`);
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const sentence = data.channel.alternatives[0].transcript;

      if (sentence.length == 0) {
        return;
      }
      if (data.is_final) {
        is_finals.push(sentence);

        if (data.speech_final) {
          const utterance = is_finals.join(" ");
          if (utterance) {
            isInterrupted = true;
            socket.emit("stream_interrupted");
            startChat(utterance);
          }
          console.log(`Speech Final: $${utterance}`);
          is_finals = [];
        } else {
          console.log(`Is Final: $${sentence}`);
        }
      } else {
        console.log(`Interim Results: $${sentence}`);
      }
    });

    connection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      const utterance = is_finals.join(" ");
      console.log(`Deepgram UtteranceEnd: $${utterance}`);
      is_finals = [];
    });

    connection.on(LiveTranscriptionEvents.SpeechStarted, (data) => {
      console.log("Deepgram SpeechStarted");
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error(err);
    });
  });

  socket.on("audioMessage", (message) => {
    connection.send(message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    connection.finish();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:$${PORT}`);
});
