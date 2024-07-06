import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are a concise answer bot.`;

const sentenceEnd = /[.!?]\s/;

async function* chatCompletionStream(
  message: string
): AsyncGenerator<string, void, unknown> {
  try {
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
      if (chunk.choices[0]?.delta?.content) {
        buffer += chunk.choices[0].delta.content;
        const sentences = buffer.split(sentenceEnd);

        if (sentences.length > 1) {
          for (let i = 0; i < sentences.length - 1; i++) {
            yield sentences[i].trim() + "."; // Add the period back
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

const startChat = async (message: string) => {
  try {
    for await (const sentence of chatCompletionStream(message.toString())) {
      console.log("sentence", sentence);
      // TODO: emit event
    }
  } catch (error) {
    console.error("Error in Socket.IO message handling:", error);
  }
};
