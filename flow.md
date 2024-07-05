1. call /agent to create new agent
2. call /call to create twillio call
3. get webhook call from twillio on /callback
4. connect twillio with ws (websocketserver.ts)
5. receive twillio audio and transcribe using deepgram (transcribe/deepgram.ts)
6. feed sentence to chat gpt
7. use synthesizer to convert into audio base64
8. send audio payload back to twillio with ws
