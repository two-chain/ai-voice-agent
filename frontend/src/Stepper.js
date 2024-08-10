import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Transcriber from "./tabs/Transcriber";
import Synthesizer from "./tabs/Synthesizer";
import LLMConfig from "./LLMConfig";

const steps = [
  { id: 1, title: "STT (Text)" },
  { id: 2, title: "LLM" },
  { id: 3, title: "TTS (Voice)" },
  { id: 4, title: "Call Provider" },
  { id: 5, title: "Task" },
];

const Step1 = ({ onValidate }) => {
  const [input, setInput] = useState("");

  const handleChange = (e) => {
    setInput(e.target.value);
    onValidate(e.target.value.length > 0);
  };

  return (
    <div>
      <label>Step 1 Input:</label>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        className="border p-2 rounded"
      />
    </div>
  );
};

const Step2 = ({ onValidate }) => {
  const [input, setInput] = useState("");

  const handleChange = (e) => {
    setInput(e.target.value);
    onValidate(e.target.value.length > 0);
  };

  return (
    <div>
      <label>Step 2 Input:</label>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        className="border p-2 rounded"
      />
    </div>
  );
};

// Repeat similar components for Step3, Step4, and Step5

const Step3 = ({ onValidate }) => {
  const [input, setInput] = useState("");

  const handleChange = (e) => {
    setInput(e.target.value);
    onValidate(e.target.value.length > 0);
  };

  return (
    <div>
      <label>Step 3 Input:</label>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        className="border p-2 rounded"
      />
    </div>
  );
};

const Step4 = ({ onValidate }) => {
  const [input, setInput] = useState("");

  const handleChange = (e) => {
    setInput(e.target.value);
    onValidate(e.target.value.length > 0);
  };

  return (
    <div>
      <label>Step 4 Input:</label>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        className="border p-2 rounded"
      />
    </div>
  );
};

const Step5 = ({ onValidate }) => {
  const [input, setInput] = useState("");

  const handleChange = (e) => {
    setInput(e.target.value);
    onValidate(e.target.value.length > 0);
  };

  return (
    <div>
      <label>Step 5 Input:</label>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        className="border p-2 rounded"
      />
    </div>
  );
};

const Stepper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isStepValid, setIsStepValid] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length && isStepValid) {
      setCurrentStep(currentStep + 1);
      setIsStepValid(false); // Reset validation for the next step
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setIsStepValid(true); // Assume previous step is valid
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Transcriber />;
      case 2:
        return <LLMConfig />;
      case 3:
        return <Synthesizer />;
      case 4:
        return <Step4 onValidate={setIsStepValid} />;
      case 5:
        return <Step5 onValidate={setIsStepValid} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8 w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pt-4 overflow-x-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative w-20 mb-4 sm:mb-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.id < currentStep
                    ? "bg-emerald-500 text-white"
                    : step.id === currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-sky-100 border-2 border-sky-200"
                }`}
              >
                {step.id < currentStep ? (
                  <Check size={14} />
                ) : (
                  <span className="text-xs">{step.id}</span>
                )}
              </div>
              {step.id === currentStep && (
                <div className="absolute top-0 left-25px w-6 h-6 rounded-full border-2 border-blue-500 animate-ping"></div>
              )}
              <p className="text-xs font-semibold mt-2 text-center">
                {step.title}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${
                  step.id < currentStep
                    ? "text-emerald-500"
                    : step.id === currentStep
                      ? "text-blue-500"
                      : "text-gray-400"
                }`}
              >
                {step.id < currentStep
                  ? "Completed"
                  : step.id === currentStep
                    ? "In Progress"
                    : "Pending"}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`hidden sm:block flex-1 h-px mx-2 ${
                  step.id < currentStep ? "bg-emerald-500" : "bg-sky-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-8">{renderStep()}</div>
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-gray-100 text-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <ChevronLeft size={16} className="mr-1 sm:mr-2" /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep === steps.length || !isStepValid}
          className="flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          Next <ChevronRight size={16} className="ml-1 sm:ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Stepper;
