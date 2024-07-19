import OpenAI from "openai";
import { EventEmitter } from "events";
import Shared from "@/common/utils/Shared";

const sentenceEnd = /[.!?]\s/;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const systemPrompt = {
  role: "system",
  content:
    "You are a helpful AI assistant that's having a conversation with a customer on a phone call, your name is Navjot. Don't include '.' unless it's a complete sentence.",
} as Message;

class ChatCompletion extends EventEmitter {
  private conversationHistory: Message[];

  constructor() {
    super();
    this.conversationHistory = [systemPrompt];
  }

  private addMessageToHistory(
    role: "user" | "assistant",
    content: string
  ): void {
    this.conversationHistory.push({ role, content });
    // Truncate history if it exceeds a certain length, but keep the system message
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = [
        systemPrompt, // Keep the system message
        ...this.conversationHistory.slice(-19), // Keep the last 19 messages
      ];
    }
  }

  private async *chatCompletionStream(
    message: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      console.log("Starting chat completion stream...");
      this.addMessageToHistory("user", message);

      const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: this.conversationHistory,
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

  public async startChat(message: string): Promise<void> {
    try {
      Shared.interrupt = false;
      for await (const sentence of this.chatCompletionStream(message)) {
        if (Shared.interrupt) break;
        console.log("sentence", sentence);
        this.emit("sentence", sentence);
        this.addMessageToHistory("assistant", sentence);
      }
    } catch (error) {
      console.error("Error in Socket.IO message handling:", error);
    }
  }
}

export default ChatCompletion;
