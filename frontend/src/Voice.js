import React from "react";

export default function App() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [canInterrupt, setCanInterrupt] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [aiState, setAiState] = React.useState("idle"); // 'idle', 'ready', 'listening', or 'talking'

  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const audioContextRef = React.useRef(null);
  const sourceNodeRef = React.useRef(null);
  const audioQueueRef = React.useRef([]);
  const isPlayingRef = React.useRef(false);
  const socketRef = React.useRef(null);

  React.useEffect(() => {
    initWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const initWebSocket = () => {
    const connect = () => {
      socketRef.current = new WebSocket("ws://localhost:8080/voice");
      socketRef.current.binaryType = "arraybuffer";

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established");
        setAiState("ready");
      };

      socketRef.current.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          console.log("Received audio data");
          audioQueueRef.current.push(event.data);
          if (!isPlayingRef.current) {
            playNextInQueue();
          }
          setCanInterrupt(true);
          setAiState("talking");
        } else {
          const message = JSON.parse(event.data);
          if (message.type === "stream_interrupted") {
            console.log("stream_interrupted");
            stopCurrentAudio();
          }
        }
      };

      socketRef.current.onclose = (event) => {
        console.log("WebSocket connection closed");
        setAiState("idle");

        // Attempt to reconnect if the connection was closed unexpectedly
        if (!event.wasClean) {
          console.log(
            "WebSocket closed unexpectedly. Attempting to reconnect..."
          );
          setTimeout(() => {
            connect();
          }, 3000); // Wait for 3 seconds before attempting to reconnect
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        // You can add additional error handling here if needed
      };
    };

    // Initial connection
    connect();
  };

  const startRecording = () => {
    stopCurrentAudio();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64data = reader.result.split(",")[1];
            const payload = JSON.stringify({
              event: "media",
              streamSid: "streamSid",
              media: {
                payload: base64data,
              },
            });
            socketRef.current.send(payload);
          };

          reader.readAsDataURL(event.data);
        };
        mediaRecorderRef.current.start(250);
        setIsRecording(true);
        setCanInterrupt(false);
        setAiState("listening");
      })
      .catch((error) => console.error("Error accessing microphone:", error));
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAiState("ready");
    }
  };

  const stopCurrentAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setCanInterrupt(false);
    setAiState("ready");
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setCanInterrupt(false);
      setAiState("ready");
      return;
    }

    isPlayingRef.current = true;
    setCanInterrupt(true);
    setAiState("talking");

    const arrayBuffer = audioQueueRef.current.shift();

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    try {
      const audioBuffer =
        await audioContextRef.current.decodeAudioData(arrayBuffer);
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.connect(audioContextRef.current.destination);
      sourceNodeRef.current.onended = playNextInQueue;
      sourceNodeRef.current.start();
    } catch (error) {
      console.error("Error decoding audio data:", error);
      playNextInQueue();
    }
  };

  React.useEffect(() => {
    const handleClick = () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        audioContextRef.current.resume();
      }
    };

    document.body.addEventListener("click", handleClick, { once: true });

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          AI Voice Assistant
        </h1>

        <div className="mb-6">
          <div
            className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
              aiState === "idle"
                ? "bg-gray-200"
                : aiState === "ready"
                  ? "bg-yellow-200"
                  : aiState === "listening"
                    ? "bg-green-200 animate-pulse"
                    : "bg-blue-200 animate-pulse"
            }`}
          >
            {aiState === "idle" && (
              <svg
                className="w-16 h-16 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {aiState === "ready" && (
              <svg
                className="w-16 h-16 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            )}
            {aiState === "listening" && (
              <svg
                className="w-16 h-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
            {aiState === "talking" && (
              <svg
                className="w-16 h-16 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            )}
          </div>
          <p className="text-center mt-2 text-gray-600">
            {aiState === "idle"
              ? "AI is initializing..."
              : aiState === "ready"
                ? "AI is ready"
                : aiState === "listening"
                  ? "AI is listening..."
                  : "AI is talking..."}
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              isRecording || aiState === "idle"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            onClick={startRecording}
            disabled={isRecording || aiState === "idle"}
          >
            Start call
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              !isRecording
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            onClick={stopRecording}
            disabled={!isRecording}
          >
            End call
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              !canInterrupt
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600 text-white"
            }`}
            onClick={stopCurrentAudio}
            disabled={!canInterrupt}
          >
            Interrupt
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 h-40 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Transcript:</h2>
          <p className="text-gray-700">
            {transcript || "No transcript available."}
          </p>
        </div>
      </div>
    </div>
  );
}
