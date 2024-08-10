import React, { useState } from "react";
import { Puzzle, Sliders, Terminal } from "lucide-react";
import LLMSettings from "./tabs/LLMSettings";
import Transcriber from "./tabs/Transcriber";
import Synthesizer from "./tabs/Synthesizer";
import CallProvider from "./tabs/CallProvider";

// Tabs Component
const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="overflow-hidden rounded-xl rounded-b-none border border-gray-100 bg-gray-50 p-2">
      <ul className="flex justify-between gap-2 text-sm font-medium">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </ul>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, children }) => (
  <button
    className={`text-gra relative flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 shadow ${
      active
        ? "bg-slate-900 text-white border-t border-x border-gray-200"
        : "bg-gray-100 text-gray-500 hover:text-gray-700"
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Advanced Placeholder Component
const AdvancedPlaceholder = () => (
  <div className="text-center py-12">
    <Sliders className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-lg font-medium text-gray-900">
      Advanced Settings
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Fine-tune your LLM with advanced configuration options.
    </p>
  </div>
);

// Main Component
const LLMModelSelector = () => {
  const [activeTab, setActiveTab] = useState("llm");

  const tabs = [
    { id: "llm", label: "LLM" },
    { id: "tts", label: "TTS" },
    { id: "stt", label: "STT" },
    { id: "callprovider", label: "Call Provider" },
    { id: "runner", label: "Runner" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "llm":
        return <LLMSettings />;
      case "tts":
        return <Synthesizer />;
      case "stt":
        return <Transcriber />;
      case "callprovider":
        return <CallProvider />;
      case "runner":
        return <AdvancedPlaceholder />;

      default:
        return null;
    }
  };

  return (
    <div className="p-6 shadow-sm w-full">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="bg-white p-6 rounded-lg rounded-t-none">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default function Configure() {
  return <LLMModelSelector />;
}
