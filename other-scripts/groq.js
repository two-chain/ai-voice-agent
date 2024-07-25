const { Groq } = require("groq-sdk");

const dotenv = require("dotenv");

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama3-groq-70b-8192-tool-use-preview";

function calculate(expression) {
  try {
    // Note: Using eval() in JavaScript can be dangerous.
    // In a production environment, you should use a safer alternative.
    const result = eval(expression);
    return JSON.stringify({ result });
  } catch {
    return JSON.stringify({ error: "Invalid expression" });
  }
}

function getWeather(location) {
  // This is a mock function. In a real scenario, you would call a weather API.
  const mockWeather = {
    temperature: 22,
    condition: "Sunny",
    humidity: 60,
  };
  return JSON.stringify(mockWeather);
}

function bookAppointment(date, time) {
  // This is a mock function. In a real scenario, you would interact with a booking system.
  return JSON.stringify({
    status: "Appointment booked successfully for " + date + " at " + time,
  });
}

function checkFreeSlots(date) {
  // This is a mock function. In a real scenario, you would query a booking system.
  const mockSlots = ["09:00", "11:00", "14:00", "16:00"];
  return JSON.stringify({ freeSlots: mockSlots });
}

async function runConversation(userPrompt) {
  const messages = [
    {
      role: "system",
      content:
        "You are an assistant capable of performing calculations, checking weather, and managing appointments. Use the provided functions to assist users with their queries.",
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  const tools = [
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
              description: "The date to check for free slots (YYYY-MM-DD)",
            },
          },
          required: ["date"],
        },
      },
    },
  ];

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
      calculate: calculate,
      getWeather: getWeather,
      bookAppointment: bookAppointment,
      checkFreeSlots: checkFreeSlots,
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
}

const userPrompt = "Book appointment tommorow 2 PM";
runConversation(userPrompt).catch(console.error);
