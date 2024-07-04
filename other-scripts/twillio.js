const express = require("express");
const dotenv = require("dotenv");
const twilio = require("twilio");
const axios = require("axios");
const fs = require("fs");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const http = require("http");
const { Server } = require("socket.io");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const { chatCompletionStream } = require("./openai");
const { synthesizeAudio, getAudio } = require("./deepgram-synthesizer");
const VoiceResponse = twilio.twiml.VoiceResponse;

dotenv.config();
const app = express();
const port = 8001;

let ws;

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/voice" });

const app_callback_url = `https://${process.env.NGROK_HOST}`;
const websocket_url = `wss://${process.env.NGROK_HOST}`;

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

let is_finals = [];
const dgConnection = deepgram.listen.live({
  model: "nova-2",
  language: "en-US",
  filler_words: true,
  smart_format: true,
  interim_results: true,
  utterance_end_ms: 1000,
  vad_events: true,
  endpointing: 300,
  diarize: true,
  encoding: "mulaw",
  sample_rate: 8000,
});

let streamSid;

setInterval(() => {
  dgConnection.keepAlive();
}, 5000);

dgConnection.on(LiveTranscriptionEvents.Open, () => {
  console.log("Deepgram connection opened");

  async function startChat(message) {
    try {
      for await (const sentence of chatCompletionStream(message.toString())) {
        console.log("sentence", sentence);
        const audioData = await getAudio(sentence);
        const payload = JSON.stringify({
          event: "media",
          streamSid: streamSid,
          media: {
            payload: audioData,
          },
        });
        console.log("sending....");
        ws.send(payload, console.error);
      }
    } catch (error) {
      console.error("Error in Socket.IO message handling:", error);
    }
  }
  dgConnection.on(LiveTranscriptionEvents.Close, (err) => {
    console.log("DG Connection closed.", err);
  });

  dgConnection.on(LiveTranscriptionEvents.Metadata, (data) => {
    console.log(`Deepgram Metadata: $${data}`);
  });

  dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const sentence = data.channel.alternatives[0].transcript;

    if (sentence.length == 0) {
      return;
    }
    if (data.is_final) {
      is_finals.push(sentence);

      if (data.speech_final) {
        const utterance = is_finals.join(" ");
        if (utterance) {
          //   isInterrupted = true;
          //   socket.emit("stream_interrupted");
          startChat(utterance); //TTT
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

  dgConnection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
    const utterance = is_finals.join(" ");
    console.log(`Deepgram UtteranceEnd: $${utterance}`);
    is_finals = [];
  });

  dgConnection.on(LiveTranscriptionEvents.SpeechStarted, (data) => {
    console.log("Deepgram SpeechStarted");
  });

  dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error(err);
  });
});

const twilio_account_sid = process.env.TWILIO_ACCOUNT_SID;
const twilio_auth_token = process.env.TWILIO_AUTH_TOKEN;
const twilio_phone_number = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const twilio_client = twilio(twilio_account_sid, twilio_auth_token);
twilio_client.logLevel = "debug";

// In-memory store for agents (replace with a database in production)
const agents = new Map();

async function populate_ngrok_tunnels() {
  try {
    const response = await axios.get("http://localhost:4040/api/tunnels");
    let app_callback_url, websocket_url;

    if (response.status === 200) {
      const data = response.data;

      for (const tunnel of data.tunnels) {
        if (tunnel.name === "twilio-app") {
          app_callback_url = tunnel.public_url;
        } else if (tunnel.name === "bolna-app") {
          websocket_url = tunnel.public_url.replace("https:", "wss:");
        }
      }

      return [app_callback_url, websocket_url];
    } else {
      console.log(
        `Error: Unable to fetch data. Status code: ${response.status}`
      );
      return [null, null];
    }
  } catch (error) {
    console.error("Error in populate_ngrok_tunnels:", error);
    return [null, null];
  }
}

app.use(express.json());

// New route to create an agent
app.post("/create_agent", (req, res) => {
  try {
    const agent_id = uuidv4();
    const agent_info = {
      id: agent_id,
      created_at: new Date(),
      // Add any other agent information you want to store
    };

    agents.set(agent_id, agent_info);

    res.status(200).json({ agent_id: agent_id });
  } catch (error) {
    console.error("Exception occurred in create_agent:", error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

app.post("/call", async (req, res) => {
  try {
    const call_details = req.body;
    const agent_id = call_details.agent_id;

    if (!agent_id) {
      return res.status(404).json({ detail: "Agent not provided" });
    }

    if (!agents.has(agent_id)) {
      return res.status(404).json({ detail: "Agent not found" });
    }

    if (!call_details || !call_details.recipient_phone_number) {
      return res
        .status(404)
        .json({ detail: "Recipient phone number not provided" });
    }

    console.log(`app_callback_url: ${app_callback_url}`);
    console.log(`websocket_url: ${websocket_url}`);
    console.log("tokens");
    console.log(
      `${twilio_account_sid} ${twilio_auth_token} ${twilio_phone_number}`
    );

    const call = await twilio_client.calls.create({
      to: call_details.recipient_phone_number,
      from: twilio_phone_number,
      //   url: `https://d408-2601-5cc-c581-10e0-7d7e-8aae-d76c-ca51.ngrok-free.app/twilio_callback`,
      url: `${app_callback_url}/twilio_callback?ws_url=${websocket_url}&agent_id=${agent_id}`,
      method: "POST",
      record: true,
    });

    res.status(200).send("done");
  } catch (error) {
    console.error("Exception occurred in make_call:", error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

app.post("/twilio_callback", async (req, res) => {
  try {
    const ws_url = req.query.ws_url;
    const agent_id = req.query.agent_id;

    const response = new VoiceResponse();
    const connect = response.connect();
    const websocket_twilio_route = `${ws_url}/voice`;
    connect.stream({ url: websocket_twilio_route });
    response.say(
      "This TwiML instruction is unreachable unless the Stream is ended by your WebSocket server."
    );

    console.log(`websocket connection done to ${websocket_twilio_route}`);

    res.status(200).type("text/xml").send(response.toString());
  } catch (error) {
    console.error("Exception occurred in twilio_callback:", error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("true");
});

const outputFile = fs.createWriteStream("output.ulaw");

wss.on("connection", (_ws) => {
  console.log("Client connected");
  ws = _ws;

  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    switch (data.event) {
      case "connected":
        console.info("Twilio media stream connected");
        break;
      case "start":
        streamSid = data.streamSid;
        console.info("Twilio media stream started", streamSid);
        break;
      case "media":
        streamSid = data.streamSid;
        // console.log("media sq: ", data);
        const audioBuffer = Buffer.from(data.media.payload, "base64");

        dgConnection.send(audioBuffer);
        // outputFile.write(audioBuffer);
        break;
      case "stop":
        console.info("Twilio media stream stopped");
        break;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    outputFile.end(); // Close the file stream when the client disconnects
  });
});

// Start the server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
