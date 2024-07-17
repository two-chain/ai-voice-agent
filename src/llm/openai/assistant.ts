import OpenAI from "openai";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import { Readable } from "stream";
import Shared from "@/common/utils/Shared";

dotenv.config();

export default class AssistantManager extends EventEmitter {
  private openai: OpenAI;
  private responseStream: Readable;
  assistantId: any;
  threadId: any;

  constructor() {
    super();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.responseStream = new Readable({
      read() {},
    });
    this.initSentenceBuilder();
  }

  private initSentenceBuilder(): void {
    let currentSentence = "";
    this.responseStream.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      for (const char of text) {
        currentSentence += char;
        if (".!?".includes(char) && currentSentence.trim().length > 0) {
          this.emit("sentence", currentSentence.trim());
          currentSentence = "";
        }
      }
    });
  }

  async init() {
    const assistantId = await this.createAssistant();
    console.log("assistant", assistantId);

    const threadId = await this.createThread();
    console.log("thread", threadId);
    this.assistantId = assistantId;
    this.threadId = threadId;
  }

  private async createAssistant(): Promise<string> {
    const assistant = await this.openai.beta.assistants.create({
      instructions: "You are a helpful assistant.",
      name: "Quickstart Assistant",
      model: "gpt-4-turbo-preview",
      tools: [],
    });
    return assistant.id;
  }

  private async createThread(): Promise<string> {
    const thread = await this.openai.beta.threads.create();
    return thread.id;
  }

  async addMessage(content: string, threadId: string): Promise<any> {
    return this.openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content,
    });
  }

  private async onEvent(event: any): Promise<void> {
    try {
      if (event.event === "thread.run.requires_action") {
        await this.handleRequiresAction(event.data);
      } else if (event?.event === "thread.message.delta") {
        const chunk = event.data.delta.content[0].text.value;
        this.responseStream.push(chunk);
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  private async handleRequiresAction(data: any): Promise<void> {
    try {
      const toolOutputs = data.required_action.submit_tool_outputs.tool_calls
        .map((toolCall: any) => {
          switch (toolCall.function.name) {
            case "getCurrentWeather":
              return { tool_call_id: toolCall.id, output: "57" };
            case "getRainProbability":
              return { tool_call_id: toolCall.id, output: "0.06" };
            default:
              return null;
          }
        })
        .filter((output: any) => output !== null);

      await this.submitToolOutputs(toolOutputs, data.id, data.thread_id);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  private async submitToolOutputs(
    toolOutputs: any[],
    runId: string,
    threadId: string
  ): Promise<void> {
    try {
      const stream =
        await this.openai.beta.threads.runs.submitToolOutputsStream(
          threadId,
          runId,
          { tool_outputs: toolOutputs }
        );
      for await (const event of stream) {
        await this.onEvent(event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }

  private async runThread(
    threadId: string,
    assistantId: string
  ): Promise<AsyncIterable<any>> {
    return this.openai.beta.threads.runs.createAndStream(threadId, {
      assistant_id: assistantId,
    });
  }

  async startChat(input: string): Promise<void> {
    await this.addMessage(input, this.threadId);
    Shared.interrupt = false;
    const stream = await this.runThread(this.threadId, this.assistantId);
    for await (const event of stream) {
      await this.onEvent(event);
    }

    this.responseStream.push(null); // End the stream
  }
}

// Example usage
const run = async () => {
  const assistantManager = new AssistantManager();

  assistantManager.on("sentence", (sentence: string) => {
    console.log("Completed sentence:", sentence);
  });

  await assistantManager.startChat(
    "Tell me a short story about a brave knight."
  );
};

// run();
