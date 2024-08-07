import React, { useState } from "react";
import { ChevronDown, Save } from "lucide-react";

const CallProvider = () => {
  const [provider, setProvider] = useState("Twilio");
  const [hangupLogic, setHangupLogic] = useState(
    "Call hangs up on silence for 10 seconds"
  );
  const [hangupTime, setHangupTime] = useState(10);
  const [terminationLogic, setTerminationLogic] = useState(
    "The call ends after 90 seconds of call time"
  );
  const [terminationTime, setTerminationTime] = useState(90);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Provider</h2>
        <div className="relative">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
          >
            <option>Twilio</option>
            {/* Add more options as needed */}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Call hangup logic</h2>
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <select
              value={hangupLogic}
              onChange={(e) => setHangupLogic(e.target.value)}
              className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
            >
              <option>Call hangs up on silence for 10 seconds</option>
              {/* Add more options as needed */}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={20} />
            </div>
          </div>
          <div className="flex-shrink-0 w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time (seconds)
            </label>
            <input
              type="range"
              min="0"
              max="60"
              value={hangupTime}
              onChange={(e) => setHangupTime(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-right text-sm text-gray-500">{hangupTime}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Call Termination</h2>
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <select
              value={terminationLogic}
              onChange={(e) => setTerminationLogic(e.target.value)}
              className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
            >
              <option>The call ends after 90 seconds of call time</option>
              {/* Add more options as needed */}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={20} />
            </div>
          </div>
          <div className="flex-shrink-0 w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time (seconds)
            </label>
            <input
              type="range"
              min="0"
              max="300"
              value={terminationTime}
              onChange={(e) => setTerminationTime(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-right text-sm text-gray-500">
              {terminationTime}
            </div>
          </div>
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

export default CallProvider;
