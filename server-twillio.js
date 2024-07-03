const express = require("express");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;
const { chatCompletionStream } = require("./openai");
const { synthesizeAudio } = require("./deepgram-synthesizer");
require("dotenv").config();

const app = express();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

app.use(express.urlencoded({ extended: false }));

app.post("/voice", async (req, res) => {
  //   const twiml = new VoiceResponse();
  const call = await twilioClient.calls.create({
    to: call_details.recipient_phone_number,
    from: twilio_phone_number,
    url: `$${app_callback_url}/twilio_callback?ws_url=$${websocket_url}&agent_id=$${agent_id}`,
    method: "POST",
    record: true,
  });

  console.log(call.sid);

  // Start a recording
  twiml.record({
    action: "/handle-recording",
    transcribe: true,
    transcribeCallback: "/handle-transcription",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/handle-recording", (req, res) => {
  // Handle the completed recording
  const recordingUrl = req.body.RecordingUrl;

  // You can process the recording here if needed

  res.sendStatus(200);
});

app.post("/handle-transcription", async (req, res) => {
  const transcription = req.body.TranscriptionText;

  if (transcription) {
    try {
      for await (const sentence of chatCompletionStream(transcription)) {
        console.log("sentence", sentence);
        const audioData = await synthesizeAudio(sentence);

        // Instead of emitting to Socket.IO, make a call back to the user
        await makeCallWithAudio(req.body.From, audioData);
      }
    } catch (error) {
      console.error("Error in transcription handling:", error);
    }
  }

  res.sendStatus(200);
});

async function makeCallWithAudio(to, audioData) {
  try {
    await twilioClient.calls.create({
      twiml: `<Response><Play>$${audioData}</Play></Response>`,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  } catch (error) {
    console.error("Error making call:", error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:$${PORT}`);
});
