import OpenAI from "openai";
import { EventEmitter } from "events";

const sentenceEnd = /[.!?]\s/;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const systemPrompt = "you are bot";

async function* chatCompletionStream(
  message: string
): AsyncGenerator<string, void, unknown> {
  try {
    console.log("Starting chat completion stream...");
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: true,
    });

    // console.log("Stream object received:", stream);

    let buffer = "";
    for await (const chunk of stream) {
      // console.log("Received chunk:", chunk);
      if (chunk.choices[0]?.delta?.content) {
        buffer += chunk.choices[0].delta.content;
        const sentences = buffer.split(sentenceEnd);

        if (sentences.length > 1) {
          for (let i = 0; i < sentences.length - 1; i++) {
            yield sentences[i].trim() + ".";
          }
          buffer = sentences[sentences.length - 1];
        }
      }
    }

    if (buffer) {
      yield buffer.trim();
    }
  } catch (error) {
    console.error("Error in chat completion:", error);
    throw error;
  }
}

class ChatCompletion extends EventEmitter {
  constructor() {
    super();
  }

  async startChat(message: string): Promise<void> {
    try {
      for await (const sentence of chatCompletionStream(message)) {
        console.log("sentence", sentence);
        this.emit("sentence", sentence);
      }
    } catch (error) {
      console.error("Error in Socket.IO message handling:", error);
    }
  }
}

export default ChatCompletion;
