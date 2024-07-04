// Example filename: index.js

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const recorder = require("node-record-lpcm16");
const dotenv = require("dotenv");
dotenv.config();

const live = async () => {
  // STEP 1: Create a Deepgram client using the API key
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  // STEP 2: Create a live transcription connection
  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
    endpointing: 300,
  });

  // STEP 3: Set up recorder
  const recording = recorder.record({
    sampleRate: 16000,
    channels: 1,
    audioType: "raw",
  });

  // STEP 4: Listen for events from the live transcription connection
  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Connection opened. Start speaking...");

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log(data.channel.alternatives[0].transcript);
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error(err);
    });

    // STEP 5: Send microphone data to Deepgram
    recording.stream().on("data", (chunk) => {
      connection.send(chunk);
    });
  });

  // Handle interrupts
  process.on("SIGINT", () => {
    console.log("Stopping...");
    recording.stop();
    connection.finish();
    process.exit();
  });
};

live();
