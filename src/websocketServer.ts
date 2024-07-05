// websocketServer.ts
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "@/server";
import DeepgramTranscription from "@/transcriber/deepgram";
import { chatCompletionStream } from "@/llm/openai";

function stringifyWebSocket(websocket: any) {
  const seen = new WeakSet();

  return JSON.stringify(
    websocket,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }

      // Exclude non-enumerable properties and functions
      if (typeof value === "function") {
        return "[Function]";
      }

      return value;
    },
    4
  );
}

const startChat = async (message: string) => {
  try {
    for await (const sentence of chatCompletionStream(message.toString())) {
      console.log("sentence", sentence);

      // TODO: call audio synthesizer
      // const audioData = await getAudio(sentence);
      // const payload = JSON.stringify({
      //   event: "media",
      //   streamSid: streamSid,
      //   media: {
      //     payload: audioData,
      //   },
      // });
      // console.log("sending....");
      // ws.send(payload, console.error);
    }
  } catch (error) {
    console.error("Error in Socket.IO message handling:", error);
  }
};

const setupWebSocket = (server: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: "/voice" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("New WebSocket connection established", ws);

    const transcriber = new DeepgramTranscription(ws);

    transcriber.on("transcription", startChat);

    transcriber.on("close", () => {
      console.log("Transcription ended");
    });

    ws.on("message", (message: string) => {
      // logger.info(`Received message: $${message}`);
      // Handle incoming messages
      const data = JSON.parse(message);
      switch (data.event) {
        case "connected":
          console.info("Twilio media stream connected");
          break;
        case "start":
          transcriber.setStreamSid(data.streamSid);
          console.info("Twilio media stream started");
          break;
        case "media":
          const audioBuffer = Buffer.from(data.media.payload, "base64");
          transcriber.dgConnection.send(audioBuffer);
          break;
        case "stop":
          console.info("Twilio media stream stopped");
          break;
      }
    });

    ws.on("close", () => {
      logger.info("WebSocket connection closed");
    });

    ws.on("error", (error: Error) => {
      logger.error(`WebSocket error: $${error}`);
    });
  });

  return wss;
};

export default setupWebSocket;
