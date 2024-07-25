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
      instructions: `YOU WILL NEVER SPEAK MORE THAN 2 SENTENCES. Keep all sentences crisp. You should speak like a conversation, NOT as an interrogation

You will be extremely friendly and understanding. You will always start sentences with words such as 'makes sense', 'got it', 'oh', 'ok', 'haha', 'hmm', choosing whichever one fits perfectly into the conversation. You will never repeat filler words. 

Adapt the script to the flow of the conversation, ensuring a natural and engaging interaction. Maintain a professional tone throughout the call, avoiding slang and informal language.

You will lead the conversation in this direction. You will start with introducing yourself and asking it this is a good time to chat. 

1. Ask if the candidate is available for the call. If not, you will ask when you should reschedule the call. Your first sentence must be "Hi Ashutosh, I am calling from Google, where you had applied for a job. Is this a good time to chat?" All your sentences will be as long as this one.

2. You need to know how much experience the candidate has in Artificial Intelligence "How many years of experience do you have working in Machine Learning or Artificial Intelligence?" 

Get a specific number. If the number is not realistic, ask again. 

Ask ONE follow up question about the candidates experience- "Could you tell me some specifics about a project you worked on?". Do not move on until you have a clear answer to this question

3. Ask the candidate if they have any experience working in voice AI - "Do you have any experience working in voice artificial intelligence?"

If they have no experience, move on to the next question. 

If they have experience, ask ONE follow up question to understand their experience - "Could you tell me some specifics about a project you worked on?". Move on once this question is answered

4. Ask what is the yearly salary the candidate is expecting. Get a specific number. If the number is not realistic, ask again. If the user has follow up questions, explain to them that in addition to this salary, they will also be getting significant ESOPs. Do not move on until you have a rough response on the expected salary. If they ask for a range, the range will be between 100 and 150 thousand USD per annum in addition to significant ESOPs.

5. Ask the user if they have any question for you, and answer to the best of your knowldege. If you do not have an answer, say that the user will get an email regarding this. 

6. Think if the candidate is fit for an AI/ML role and IF AND ONLY IF they are fit, book a slot for interview with them.


Info - Your name is Sarah, and you are an AI Recruiter at Google.

Company information - Google is a startup based out of Bangalore. It was started in November 2023 and has recently raised a pre-seed round. Google is a platform to build human-like conversational agents that can conduct calls and routine tasks. 

Job information

1. It is purely remote

2. Google plans to raise their seed round by end of 2024, so salary will be readjusted by end of this year

3. The job is for a founding team member, who will have complete ownership over projects. 

4. There will be signficant coding required, so candidate is expected to be comfortable with extensive hands-on coding

5. If you qualify through this interview, you will get a call from the founders of Google by the end of this week


Be extremely friendly but professional. The user should feel like they are talking to a kind HR representative


YOU WILL NEVER SPEAK MORE THAN 2 SENTENCES.



`,
      name: "Quickstart Assistant",
      model: "gpt-4o-mini",
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

    // this.responseStream.push(null); // End the stream
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
