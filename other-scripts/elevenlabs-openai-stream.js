const WebSocket = require("ws");
const { OpenAI } = require("openai");
const { Readable } = require("stream");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

// Define API keys and voice ID
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "osdlNpsPhDrxYr6B89IH";

// Set OpenAI API key
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function* textChunker(chunks) {
  const splitters = [
    ".",
    ",",
    "?",
    "!",
    ";",
    ":",
    "—",
    "-",
    "(",
    ")",
    "[",
    "]",
    "}",
    " ",
  ];
  let buffer = "";

  for await (const text of chunks) {
    if (splitters.includes(buffer[buffer.length - 1])) {
      yield buffer + " ";
      buffer = text;
    } else if (splitters.includes(text[0])) {
      yield buffer + text[0] + " ";
      buffer = text.slice(1);
    } else {
      buffer += text;
    }
  }

  if (buffer) {
    yield buffer + " ";
  }
}

async function stream(audioStream) {
  const filePath = "output_audio.wav";
  const writeStream = fs.createWriteStream(filePath);

  audioStream.pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      console.log(`Audio saved to $${filePath}`);
      resolve();
    });

    writeStream.on("error", (error) => {
      console.error("Error writing audio to file:", error);
      reject(error);
    });
  });
}

async function textToSpeechInputStreaming(voiceId, textIterator) {
  const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2`;
  // wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id={model}

  console.log("Connecting to WebSocket:", uri);
  console.log(ELEVENLABS_API_KEY);
  const ws = new WebSocket(uri, {
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  ws.on("open", () => {
    console.log("WebSocket connection opened");
    ws.send(
      JSON.stringify({
        text: " ",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      })
    );
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", (code, reason) => {
    console.log(`WebSocket closed: $${code} $${reason}`);
  });

  const audioStream = new Readable({
    read() {},
  });

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.audio) {
      audioStream.push(Buffer.from(data.audio, "base64"));
    } else if (data.isFinal) {
      audioStream.push(null);
    }
  });

  const streamPromise = stream(audioStream);

  for await (const text of textChunker(textIterator)) {
    ws.send(JSON.stringify({ text, try_trigger_generation: true }));
  }

  ws.send(JSON.stringify({ text: "" }));

  await streamPromise;
  ws.close();
}

async function* chatCompletion(query) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: query }],
    temperature: 1,
    stream: true,
  });

  for await (const chunk of response) {
    if (chunk.choices[0].delta.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}

async function main() {
  const userQuery = "Hello, tell me a very long story.";
  await textToSpeechInputStreaming(VOICE_ID, chatCompletion(userQuery));
}

main().catch(console.error);
