import OpenAI from "openai";
import { EventEmitter } from "events";
import Shared from "@/common/utils/Shared";

const sentenceEnd = /[.!?]\s/;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const systemPrompt =
  "You are an helpful AI assistant that's having a conversation with customer on a phone call, your name is Navjot. dont include '.' unless complete sentence";

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

    let buffer = "";
    for await (const chunk of stream) {
      if (Shared.interrupt) break;
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

    if (buffer && !Shared.interrupt) {
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
      Shared.interrupt = false;
      for await (const sentence of chatCompletionStream(message)) {
        if (Shared.interrupt) break;
        console.log("sentence", sentence);
        this.emit("sentence", sentence);
      }
    } catch (error) {
      console.error("Error in Socket.IO message handling:", error);
    }
  }
}

export default ChatCompletion;
