import { EventEmitter } from "events";

import {
  createClient,
  LiveTranscriptionEvents,
  DeepgramClient,
  ListenLiveClient,
} from "@deepgram/sdk";
import WebSocket from "ws";
import { Readable } from "stream";
import { logger } from "@/server";
// TODO: use logger
class DeepgramTranscription extends EventEmitter {
  private deepgram: DeepgramClient;
  private ws: WebSocket;
  private isFinals: string[] = [];
  private streamSid: string | null = null;
  public dgConnection: ListenLiveClient;
  private outputStream: Readable;

  constructor(websocket: WebSocket) {
    super(); // Call the EventEmitter constructor
    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    this.ws = websocket;
    this.outputStream = new Readable({
      read() {}, // This is intentionally empty as we'll push data manually
    });

    this.dgConnection = this.deepgram.listen.live({
      model: "nova-2",
      language: "en-US",
      filler_words: true,
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300,
      // diarize: true,
      // encoding: "opus", // mulaw in case of twillio
      // sample_rate: 8000,
    });

    this.setupEventListeners();
    this.startKeepAlive();
  }

  private setupEventListeners(): void {
    this.dgConnection.on(LiveTranscriptionEvents.Open, this.onOpen.bind(this));
    this.dgConnection.on(
      LiveTranscriptionEvents.Close,
      this.onClose.bind(this)
    );
    this.dgConnection.on(
      LiveTranscriptionEvents.Metadata,
      this.onMetadata.bind(this)
    );
    this.dgConnection.on(
      LiveTranscriptionEvents.Transcript,
      this.onTranscript.bind(this)
    );
    this.dgConnection.on(
      LiveTranscriptionEvents.UtteranceEnd,
      this.onUtteranceEnd.bind(this)
    );
    this.dgConnection.on(
      LiveTranscriptionEvents.SpeechStarted,
      this.onSpeechStarted.bind(this)
    );
    this.dgConnection.on(
      LiveTranscriptionEvents.Error,
      this.onError.bind(this)
    );
  }

  private startKeepAlive(): void {
    setInterval(() => {
      this.dgConnection.keepAlive();
    }, 5000);
  }

  private onOpen(): void {
    console.log("Deepgram connection opened");
  }

  private onClose(err?: Error): void {
    console.log("DG Connection closed.", err);
  }

  private onMetadata(data: any): void {
    console.log(`Deepgram Metadata: $${JSON.stringify(data)}`);
  }

  private onTranscript(data: any): void {
    const sentence = data.channel.alternatives[0].transcript;

    if (sentence.length === 0) {
      return;
    }

    if (data.is_final) {
      this.isFinals.push(sentence);

      if (data.speech_final) {
        const utterance = this.isFinals.join(" ");
        if (utterance) {
          //   this.startChat(utterance);
          //TODO: call llm
          // callback here
          // logger.debug(utterance);
          // this.outputStream.push(utterance);
          // this.outputStream.push(null);
          this.emit("transcription", utterance);
        }
        console.log(`Speech Final: $${utterance}`);
        this.isFinals = [];
      } else {
        console.log(`Is Final: $${sentence}`);
      }
    } else {
      console.log(`Interim Results: $${sentence}`);
    }
  }

  public getOutputStream(): Readable {
    return this.outputStream;
  }

  public close(): void {
    this.dgConnection.finish();
    this.emit("close");
  }

  private onUtteranceEnd(data: any): void {
    const utterance = this.isFinals.join(" ");
    console.log(`Deepgram UtteranceEnd: $${utterance}`);
    this.isFinals = [];
  }

  private onSpeechStarted(data: any): void {
    console.log("Deepgram SpeechStarted");
  }

  private onError(err: Error): void {
    console.error(err);
  }

  public setStreamSid(sid: string): void {
    this.streamSid = sid;
  }
}

export default DeepgramTranscription;
