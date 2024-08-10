const { Groq } = require("groq-sdk");
const dotenv = require("dotenv");
const readline = require("readline");

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama3-groq-70b-8192-tool-use-preview";

function calculate(expression) {
  try {
    const result = eval(expression);
    return JSON.stringify({ result });
  } catch {
    return JSON.stringify({ error: "Invalid expression" });
  }
}

function getWeather(location) {
  const mockWeather = {
    temperature: 22,
    condition: "Sunny",
    humidity: 60,
  };
  return JSON.stringify(mockWeather);
}

function bookAppointment(date, time) {
  return JSON.stringify({
    status: "Appointment booked successfully for " + date + " at " + time,
  });
}

function checkFreeSlots(date) {
  const mockSlots = ["09:00", "11:00", "14:00", "16:00"];
  return JSON.stringify({ freeSlots: mockSlots });
}

const tools = [
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
            description: "The date to check for free slots (YYYY-MM-DD)",
          },
        },
        required: ["date"],
      },
    },
  },
];

async function runConversation(userPrompt, messages) {
  messages.push({
    role: "user",
    content: userPrompt,
  });

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: messages,
    tools: tools,
    tool_choice: "auto",
    max_tokens: 4096,
    stream: true,
  });

  let fullResponse = "";
  let toolCalls = [];

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];

    if (content) {
      process.stdout.write(content);
      fullResponse += content;
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

  console.log("\n"); // New line after streaming response

  if (toolCalls.length > 0) {
    const availableFunctions = {
      calculate,
      getWeather,
      bookAppointment,
      checkFreeSlots,
    };

    messages.push({
      role: "assistant",
      content: fullResponse,
      tool_calls: toolCalls,
    });

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

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: functionResponse,
      });
    }

    const secondStream = await client.chat.completions.create({
      model: MODEL,
      messages: messages,
      stream: true,
    });

    console.log("Function result incorporated. Updated response:");

    for await (const chunk of secondStream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        process.stdout.write(content);
      }
    }
  }

  return messages;
}

async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let messages = [
    {
      role: "system",
      content:
        "You are an assistant capable of performing calculations, checking weather, and managing appointments. Use the provided functions to assist users with their queries.",
    },
  ];

  console.log(
    "Welcome to the Groq CLI Chat! Type 'exit' to end the conversation."
  );

  const askQuestion = () => {
    rl.question("\nYou: ", async (userInput) => {
      if (userInput.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      try {
        messages = await runConversation(userInput, messages);
        askQuestion();
      } catch (error) {
        console.error("An error occurred:", error);
        askQuestion();
      }
    });
  };

  askQuestion();
}

startChat();
