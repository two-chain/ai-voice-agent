const { EventEmitter } = require("events");
const OpenAI = require("openai");
const readline = require("readline");
const dotenv = require("dotenv");

dotenv.config();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class EventHandler extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
  }

  async onEvent(event) {
    try {
      //   console.log(event?.event);
      // Retrieve events that are denoted with 'requires_action'
      // since these will have our tool_calls
      if (event.event === "thread.run.requires_action") {
        await this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id
        );
      }

      if (event?.event === "thread.message.delta") {
        process.stdout.write(event.data.delta.content[0].text.value);
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolOutputs =
        data.required_action.submit_tool_outputs.tool_calls.map((toolCall) => {
          if (toolCall.function.name === "getCurrentWeather") {
            return {
              tool_call_id: toolCall.id,
              output: "57",
            };
          } else if (toolCall.function.name === "getRainProbability") {
            return {
              tool_call_id: toolCall.id,
              output: "0.06",
            };
          }
        });
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}

// Function to create an assistant
async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Weather Assistant",
    instructions:
      "You are a helpful assistant that can provide weather information.",
    model: "gpt-4-1106-preview",
    tools: [],
  });
  return assistant;
}

// Function to create a thread
async function createThread() {
  return await openai.beta.threads.create();
}

// Function to add a message to the thread
async function addMessage(threadId, content) {
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content,
  });
}

// Function to run the assistant
async function runAssistant(threadId, assistantId) {
  // We use the stream SDK helper to create a run with
  // streaming. The SDK provides helpful event listeners to handle
  // the streamed response.

  const eventHandler = new EventHandler(openai);

  eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

  const stream = await openai.beta.threads.runs.stream(
    threadId,
    { assistant_id: assistantId },
    eventHandler
  );

  for await (const event of stream) {
    eventHandler.emit("event", event);
  }
}

// Function to handle user input
async function handleUserInput(input, threadId, assistantId) {
  if (input.toLowerCase() === "quit") {
    rl.close();
    return;
  }

  await addMessage(threadId, input);
  await runAssistant(threadId, assistantId);
}

// Main function to run the example
async function main() {
  try {
    const assistant = await createAssistant();
    console.log("Assistant created with ID:", assistant.id);

    const thread = await createThread();
    console.log("Thread created with ID:", thread.id);

    console.log(
      "\nYou can start chatting with the assistant. Type 'quit' to exit."
    );
    rl.question("You > ", (input) =>
      handleUserInput(input, thread.id, assistant.id)
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the example
main();
