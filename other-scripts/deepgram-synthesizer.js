const https = require("https");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");

const dotenv = require("dotenv");
dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const DEEPGRAM_URL = "https://api.deepgram.com/v1/speak?model=aura-helios-en";
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const inputText =
  "Our story begins in a peaceful woodland kingdom where a lively squirrel named Frolic made his abode high up within a cedar tree's embrace. He was not a usual woodland creature.";
const outputFilename = "output.mp3";

function segmentTextBySentence(text) {
  return text.match(/[^.!?]+[.!?]/g).map((sentence) => sentence.trim());
}

function synthesizeAudio(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ text });
    const options = {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(DEEPGRAM_URL, options, (res) => {
      let data = [];

      res.on("data", (chunk) => {
        data.push(chunk);
      });

      res.on("end", () => {
        const buffer = Buffer.concat(data);
        resolve(buffer);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

const text = "Hello, how can I help you today?";

const getAudio = async (inputText) => {
  // STEP 1: Make a request and configure the request with options (such as model choice, audio configuration, etc.)
  const response = await deepgram.speak.request(
    { text: inputText },
    {
      model: "aura-asteria-en",
      encoding: "mulaw",
    }
  );

  // STEP 2: Get the audio stream and headers from the response
  const stream = await response.getStream();
  const headers = await response.getHeaders();

  if (stream) {
    // STEP 3: Convert the stream to an audio buffer
    const buffer = await getAudioBuffer(stream);
    console.log(buffer);
    return buffer.toString("base64");
  } else {
    console.error("Error generating audio:", stream);
  }

  if (headers) {
    console.log("Headers:", headers);
  }
};

// Helper function to convert the stream to an audio buffer
const getAudioBuffer = async (response) => {
  const reader = response.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
  }

  const dataArray = chunks.reduce(
    (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
    new Uint8Array(0)
  );

  return Buffer.from(dataArray.buffer);
};

// getAudio(inputText);

async function main() {
  const segments = segmentTextBySentence(inputText);

  // Create or truncate the output file
  const outputFile = fs.createWriteStream("outputFilename.mp3");

  for (const segment of segments) {
    try {
      const audioData = await synthesizeAudio(segment);
      outputFile.write(audioData);
      console.log("Audio stream finished for segment:", segment);
    } catch (error) {
      console.error("Error synthesizing audio:", error);
    }
  }

  console.log("Audio file creation completed.");
}

// main();

module.exports = { synthesizeAudio, getAudio };
