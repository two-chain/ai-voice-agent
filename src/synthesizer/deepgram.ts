import { EventEmitter } from "events";
import { createClient } from "@deepgram/sdk";
import { logger } from "../server"; // FIXME: path

class AudioGenerator extends EventEmitter {
  private deepgram;

  constructor() {
    super();
    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY as string);
  }

  public async generateAudio(inputText: string): Promise<string | void> {
    try {
      // STEP 1: Make a request and configure the request with options (such as model choice, audio configuration, etc.)
      const response = await this.deepgram.speak.request(
        { text: inputText },
        {
          model: "aura-asteria-en",
          encoding: "opus",
        }
      );

      // STEP 2: Get the audio stream and headers from the response
      const stream = await response.getStream();

      if (stream) {
        // STEP 3: Convert the stream to an audio buffer
        const buffer: Buffer = await this.getAudioBuffer(stream);
        // this.emit("audio", buffer.toString("base64")); // FIXME: only for twillio
        this.emit("audio", buffer);
      } else {
        logger.error("Error generating audio:", stream);
      }
    } catch (error) {
      logger.error("Error in getAudio function:", error);
    }
  }

  // Helper function to convert the stream to an audio buffer
  private async getAudioBuffer(
    stream: ReadableStream<Uint8Array>
  ): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
      }
    }

    const dataArray = chunks.reduce(
      (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
      new Uint8Array(0)
    );

    return Buffer.from(dataArray.buffer);
  }
}

export default AudioGenerator;
