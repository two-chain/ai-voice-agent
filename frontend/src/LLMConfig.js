import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const LLMConfig = () => {
  const [tokensGenerated, setTokensGenerated] = useState(148);
  const [temperature, setTemperature] = useState(0.2);
  const [useFillers, setUseFillers] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Choose LLM model</h2>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <select className="w-full p-2 border rounded-md appearance-none bg-white pr-8 relative">
            <option>Openai</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown size={20} />
          </div>
        </div>
        <div className="flex-1">
          <select className="w-full p-2 border rounded-md appearance-none bg-white pr-8 relative">
            <option>gpt-3.5-turbo</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2">
          Tokens generated on each LLM output
          <span className="float-right">{tokensGenerated}</span>
        </label>
        <input
          type="range"
          min="0"
          max="300"
          value={tokensGenerated}
          onChange={(e) => setTokensGenerated(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          Increasing this number enables longer responses but increases latency
        </p>
      </div>

      <div className="mb-6">
        <label className="block mb-2">
          Temperature
          <span className="float-right">{temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          Increasing temperature enables heightened creativity, but increases
          chance of deviation from prompt
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Use Fillers</h3>
          <p className="text-sm text-gray-500">
            Filler words reduce perceived latency, but recipients can feel that
            the AI agent is not letting them complete their sentence
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={useFillers}
            onChange={(e) => setUseFillers(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};

export default LLMConfig;
