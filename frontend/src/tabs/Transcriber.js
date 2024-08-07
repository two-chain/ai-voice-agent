import React, { useState } from "react";
import { Save } from "lucide-react";

const Transcriber = () => {
  const [endpointing, setEndpointing] = useState(100);
  const [linearDelay, setLinearDelay] = useState(450);
  const [wordsBeforeInterrupting, setWordsBeforeInterrupting] = useState(1);
  const [backchanneling, setBackchanneling] = useState(false);
  const [backchannelingStartDelay, setBackchannelingStartDelay] = useState(5);
  const [backchannelingMessageGap, setBackchannelingMessageGap] = useState(5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Choose Transcriber</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <select className="w-full p-2 border rounded-md">
            <option>Select ASR Provider</option>
          </select>
        </div>
        <div>
          <select className="w-full p-2 border rounded-md">
            <option></option>
          </select>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">Choose language</h3>
      <select className="w-full p-2 border rounded-md mb-4">
        <option>English</option>
      </select>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Endpointing (in ms)
        </label>
        <input
          type="range"
          min="0"
          max="1000"
          value={endpointing}
          onChange={(e) => setEndpointing(e.target.value)}
          className="w-full"
        />
        <div className="text-right">{endpointing}</div>
        <p className="text-sm text-gray-500 mt-1">
          Number of milliseconds your agent will wait before generating
          response. Lower endpointing reduces latency could lead to agent
          interrupting mid-sentence
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Linear delay (in ms)
        </label>
        <input
          type="range"
          min="0"
          max="1000"
          value={linearDelay}
          onChange={(e) => setLinearDelay(e.target.value)}
          className="w-full"
        />
        <div className="text-right">{linearDelay}</div>
        <p className="text-sm text-gray-500 mt-1">
          Linear delay accounts for long pauses mid-sentence. If the recipient
          is expected to speak long sentences, increase value of linear delay
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Number of words to wait for before interrupting (in words)
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={wordsBeforeInterrupting}
          onChange={(e) => setWordsBeforeInterrupting(e.target.value)}
          className="w-full"
        />
        <div className="text-right">{wordsBeforeInterrupting}</div>
        <p className="text-sm text-gray-500 mt-1">
          Agent will not consider interruptions until these many words are
          spoken (If recipient says "Stopwords" such as Stop, Wait, Hold On,
          agent will pause by default)
        </p>
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <span className="text-sm font-medium mr-2">Backchanneling</span>
          <input
            type="checkbox"
            checked={backchanneling}
            onChange={(e) => setBackchanneling(e.target.checked)}
            className="form-checkbox"
          />
        </label>
        <p className="text-sm text-gray-500 mt-1">
          Agent will speak filler words in between sentences to show the
          recipient that they are listening to them
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Backchanneling start delay
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={backchannelingStartDelay}
            onChange={(e) => setBackchannelingStartDelay(e.target.value)}
            className="w-full"
          />
          <div className="text-right">{backchannelingStartDelay}</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Backchanneling message gap
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={backchannelingMessageGap}
            onChange={(e) => setBackchannelingMessageGap(e.target.value)}
            className="w-full"
          />
          <div className="text-right">{backchannelingMessageGap}</div>
        </div>
      </div>

      <div className="mb-6">
        <button className=" bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md flex items-center">
          <Save size={20} className="mr-2" />
          Save
        </button>
      </div>
    </div>
  );
};

export default Transcriber;
