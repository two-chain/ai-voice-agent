import { Groq } from "groq-sdk";
import { EventEmitter } from "events";
import Shared from "@/common/utils/Shared";

const sentenceEnd = /[.!?]\s/;

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any;
  tool_call_id?: any;
}

const systemPrompt = {
  role: "system",
  content:
    "You are an assistant capable of performing calculations, checking weather, and managing appointments. Use the provided functions to assist users with their queries.",
} as Message;

function calculate(expression: string) {
  try {
    // Note: Using eval() in JavaScript can be dangerous.
    // In a production environment, you should use a safer alternative.
    const result = eval(expression);
    return JSON.stringify({ result });
  } catch {
    return JSON.stringify({ error: "Invalid expression" });
  }
}

function getWeather(location: any) {
  // This is a mock function. In a real scenario, you would call a weather API.
  const mockWeather = {
    temperature: 22,
    condition: "Sunny",
    humidity: 60,
  };
  return JSON.stringify(mockWeather);
}

function bookAppointment(date: any, time: string) {
  // This is a mock function. In a real scenario, you would interact with a booking system.
  return JSON.stringify({
    status: "Appointment booked successfully for " + date + " at " + time,
  });
}

function checkFreeSlots(date: any) {
  // This is a mock function. In a real scenario, you would query a booking system.
  const mockSlots = ["09:00", "11:00", "14:00", "16:00"];
  return JSON.stringify({ freeSlots: mockSlots });
}

class ChatCompletion extends EventEmitter {
  private conversationHistory: any[];

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

      const stream = await client.chat.completions.create({
        model: "llama3-groq-70b-8192-tool-use-preview",
        messages: this.conversationHistory,
        tools: [
          {
            type: "function",
            function: {
              name: "calculate",
              description: "Evaluate a mathematical expression",
              parameters: {
                type: "object",
                properties: {
                  expression: {
                    type: "string",
                    description: "The mathematical expression to evaluate",
                  },
                },
                required: ["expression"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getWeather",
              description: "Get current weather for a location",
              parameters: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description: "The location to get weather for",
                  },
                },
                required: ["location"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "bookAppointment",
              description: "Book an appointment",
              parameters: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    description: "The date for the appointment (YYYY-MM-DD)",
                  },
                  time: {
                    type: "string",
                    description: "The time for the appointment (HH:MM)",
                  },
                },
                required: ["date", "time"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "checkFreeSlots",
              description: "Check free appointment slots for a given date",
              parameters: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    description:
                      "The date to check for free slots (YYYY-MM-DD)",
                  },
                },
                required: ["date"],
              },
            },
          },
        ],
        tool_choice: "auto",
        max_tokens: 4096,
        stream: true,
      });

      ///
      ///

      let fullResponse = "";
      let toolCalls: any = [];

      let buffer = "";
      for await (const chunk of stream) {
        if (Shared.interrupt) break;
        const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          buffer += chunk.choices[0].delta.content;
          const sentences = buffer.split(sentenceEnd);

          if (sentences.length > 1) {
            for (let i = 0; i < sentences.length - 1; i++) {
              yield sentences[i].trim() + ".";
            }
            buffer = sentences[sentences.length - 1];
          }
        }
        if (toolCall) {
          if (toolCall.index === undefined) {
            toolCalls.push(toolCall);
          } else {
            toolCalls[toolCall.index] = {
              ...toolCalls[toolCall.index],
              ...toolCall,
            };
          }
        }
      }

      if (toolCalls.length > 0) {
        const availableFunctions: any = {
          calculate: calculate,
          getWeather: getWeather,
          bookAppointment: bookAppointment,
          checkFreeSlots: checkFreeSlots,
        };

        this.conversationHistory.push({
          role: "assistant",
          content: fullResponse,
          tool_calls: toolCalls,
        });
        console.log(toolCalls);

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionToCall = availableFunctions[functionName];
          const functionArgs = JSON.parse(toolCall.function.arguments);
          let functionResponse;

          switch (functionName) {
            case "calculate":
              functionResponse = functionToCall(functionArgs.expression);
              break;
            case "getWeather":
              functionResponse = functionToCall(functionArgs.location);
              break;
            case "bookAppointment":
              functionResponse = functionToCall(
                functionArgs.date,
                functionArgs.time
              );
              break;
            case "checkFreeSlots":
              functionResponse = functionToCall(functionArgs.date);
              break;
          }

          this.conversationHistory.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: functionResponse,
          });
        }

        const secondStream = await client.chat.completions.create({
          model: "llama3-groq-70b-8192-tool-use-preview",
          messages: this.conversationHistory,
          stream: true,
        });

        for await (const chunk of secondStream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            buffer += content;
            const sentences = buffer.split(sentenceEnd);

            if (sentences.length > 1) {
              for (let i = 0; i < sentences.length - 1; i++) {
                yield sentences[i].trim() + ".";
              }
              buffer = sentences[sentences.length - 1];
            }
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
