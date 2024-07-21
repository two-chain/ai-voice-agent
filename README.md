# AI-Powered Call Assistant

This project implements an AI-powered call assistant using Node.js and React.js. It leverages OpenAI's GPT model, Twilio for call handling, Deepgram for speech-to-text and text-to-speech operations, and WebSocket for real-time communication.

## Table of Contents

- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [System Architecture](#system-architecture)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Overview

This AI-powered call assistant can handle incoming calls, transcribe speech to text, process the text using OpenAI's GPT model, generate responses, convert those responses to speech, and send the audio back to the caller in real-time.

## Technologies Used

- Node.js
- React.js
- OpenAI GPT
- Twilio
- Deepgram (for transcription and audio synthesis)
- WebSocket

## System Architecture

The system follows this high-level flow:

1. Create a new agent using the `/agent` endpoint
2. Initiate a Twilio call using the `/call` endpoint
3. Receive webhook calls from Twilio on the `/callback` endpoint
4. Connect Twilio with WebSocket server (websocketserver.ts)
5. Receive Twilio audio and transcribe using Deepgram (transcribe/deepgram.ts)
6. Feed the transcribed sentence to ChatGPT
7. Use Deepgram synthesizer to convert ChatGPT's response into audio (base64 format)
8. Send audio payload back to Twilio via WebSocket

### LLM (OpenAI) Flow:

1. Create an assistant
2. Create a thread (kind of session)
3. Add a message to the thread
4. Run the thread

### Example screens:

<img src="/assets/ai-idle.png" alt="idle screenshot" width="200"/>
<img src="/assets/ai-listening.png" alt="listening screenshot" width="200"/>
<img src="/assets/ai-ready.png" alt="ready screenshot" width="200"/>

## Setup and Installation

## Usage

## API Endpoints

- `/agent`: Creates a new agent
- `/call`: Initiates a Twilio call
- `/callback`: Receives webhook calls from Twilio

## Contributing

## License
