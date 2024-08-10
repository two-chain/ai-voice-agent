// websocketServer.ts
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "@/server";
import DeepgramTranscription from "@/transcriber/deepgram";
import AudioGenerator from "@/synthesizer/deepgram";
// import ChatCompletion from "@/llm/openai";
import ChatCompletion from "@/llm/groq/assistant";
import Shared from "./common/utils/Shared";
import AssistantManager from "./llm/openai/assistant";

const setupWebSocket = (server: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: "/voice" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("New WebSocket connection established", ws);

    const transcriber = new DeepgramTranscription();
    const chat = new ChatCompletion();
    // const assistantManager = new AssistantManager();
    // assistantManager.init();
    const synthsizer = new AudioGenerator();

    transcriber.on("transcription-chunk", async (transcription) => {
      console.log("On:transcription");
      // interrupt event
      Shared.interrupt = true;
      ws.send(JSON.stringify({ type: "stream_interrupted" }));
      // await assistantManager.startChat(transcription);
      await chat.startChat(transcription);
    });

    chat.on("sentence", (sentence) => {
      console.log(
        "On: sentence--------------------------" + typeof sentence,
        sentence
      );
      synthsizer.generateAudio(sentence);
    });

    synthsizer.on("audio", (buffer) => {
      ws.send(buffer);
    });

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
