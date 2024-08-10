require("dotenv").config();
const OpenAI = require("openai");
const readline = require("readline");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock database for available slots
const availableSlots = {
  "2023-07-25": ["09:00", "10:00", "14:00", "15:00"],
  "2023-07-26": ["11:00", "13:00", "16:00"],
  "2023-07-27": ["09:30", "10:30", "14:30", "15:30"],
};

// Function to check if a slot is available
function isSlotAvailable(date, time) {
  return availableSlots[date] && availableSlots[date].includes(time);
}

// Function to book an appointment
function bookAppointment(date, time, service) {
  if (isSlotAvailable(date, time)) {
    // Remove the booked slot from available slots
    availableSlots[date] = availableSlots[date].filter((slot) => slot !== time);
    console.log(`Appointment booked for ${service} on ${date} at ${time}`);
    return {
      success: true,
      message: `Appointment booked for ${service} on ${date} at ${time}`,
    };
  } else {
    console.log(`Sorry, the slot on ${date} at ${time} is not available.`);
    return {
      success: false,
      message: `The slot on ${date} at ${time} is not available.`,
    };
  }
}

// Define the function that ChatGPT can call
const functions = [
  {
    name: "book_appointment",
    description: "Book an appointment for a specific service",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "The date of the appointment (YYYY-MM-DD)",
        },
        time: {
          type: "string",
          description: "The time of the appointment (HH:MM)",
        },
        service: {
          type: "string",
          description: "The type of service for the appointment",
        },
      },
      required: ["date", "time", "service"],
    },
  },
];
const messages = [
  {
    role: "system",
    content: `You are a helpful assistant that books appointments. Todays date is ${Date()}`,
  },
];

async function chatWithBot(userInput) {
  messages.push({ role: "user", content: userInput });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      functions: functions,
      function_call: "auto",
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      if (functionName === "book_appointment") {
        const result = bookAppointment(
          functionArgs.date,
          functionArgs.time,
          functionArgs.service
        );

        messages.push(responseMessage);
        messages.push({
          role: "function",
          name: "book_appointment",
          content: JSON.stringify(result),
        });

        const secondResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages,
        });

        return secondResponse.choices[0].message.content;
      }
    } else {
      return responseMessage.content;
    }
  } catch (error) {
    console.error("Error:", error);
    return "Sorry, there was an error processing your request.";
  }
}

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to start the chat
function startChat() {
  rl.question("You: ", async (userInput) => {
    if (userInput.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    const response = await chatWithBot(userInput);
    console.log("Bot:", response);
    startChat();
  });
}

console.log("Welcome to the Appointment Booking Chatbot!");
console.log('Type "exit" to end the conversation.');
startChat();
