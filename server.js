const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const path = require("path");
const { chatCompletionStream } = require("./openai");
const { synthesizeAudio } = require("./deepgram-synthesizer");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  let is_finals = [];

  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    // Apply smart formatting to the output
    smart_format: true,
    // To get UtteranceEnd, the following must be set:
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
    // Time in milliseconds of silence to wait for before finalizing speech
    endpointing: 300,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram connection opened");

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });

    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log(`Deepgram Metadata: ${data}`);
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const sentence = data.channel.alternatives[0].transcript;

      // Ignore empty transcripts
      if (sentence.length == 0) {
        return;
      }
      if (data.is_final) {
        // We need to collect these and concatenate them together when we get a speech_final=true
        // See docs: https://developers.deepgram.com/docs/understand-endpointing-interim-results
        is_finals.push(sentence);

        // Speech final means we have detected sufficent silence to consider this end of speech
        // Speech final is the lowest latency result as it triggers as soon an the endpointing value has triggered
        if (data.speech_final) {
          const utterance = is_finals.join(" ");
          if (utterance) {
            // ws.send(JSON.stringify({ transcript: utterance }));
            // TODO: call LLM
            startChat(utterance);
          }
          console.log(`Speech Final: ${utterance}`);
          is_finals = [];
        } else {
          // These are useful if you need real time captioning and update what the Interim Results produced
          console.log(`Is Final: ${sentence}`);
        }
      } else {
        // These are useful if you need real time captioning of what is being spoken
        console.log(`Interim Results: ${sentence}`);
      }
    });

    connection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      const utterance = is_finals.join(" ");
      console.log(`Deepgram UtteranceEnd: ${utterance}`);
      is_finals = [];
    });

    connection.on(LiveTranscriptionEvents.SpeechStarted, (data) => {
      console.log("Deepgram SpeechStarted");
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error(err);
    });
  });

  async function startChat(message) {
    try {
      for await (const sentence of chatCompletionStream(message.toString())) {
        console.log("sentence", sentence);
        const audioData = await synthesizeAudio(sentence);
        ws.send(audioData, { binary: true });
      }
    } catch (error) {
      console.error("Error in WebSocket message handling:", error);
    }
  }

  ws.on("message", (message) => {
    connection.send(message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    connection.finish();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
