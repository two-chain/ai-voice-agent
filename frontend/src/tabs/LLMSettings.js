import React from "react";
import { ChevronDown, Save } from "lucide-react";
import { Formik, Form, Field } from "formik";

// LLM Settings Component
const LLMSettings = () => {
  const initialValues = {
    llmProvider: "Openai",
    model: "gpt-3.5-turbo",
    tokensGenerated: 148,
    temperature: 0.2,
    useFillers: false,
  };

  const handleSubmit = (values, { setSubmitting }) => {
    // Handle form submission here
    console.log(values);
    setSubmitting(false);
    // TODO: call api to save configuration
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, dirty, isSubmitting }) => (
        <Form>
          <h2 className="text-xl font-semibold mb-4">Choose LLM model</h2>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Field
                as="select"
                name="llmProvider"
                className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
              >
                <option>Openai</option>
              </Field>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={20} />
              </div>
            </div>
            <div className="flex-1 relative">
              <Field
                as="select"
                name="model"
                className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
              >
                <option>gpt-3.5-turbo</option>
              </Field>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2">
              Tokens generated on each LLM output
              <span className="float-right">{values.tokensGenerated}</span>
            </label>
            <Field
              type="range"
              name="tokensGenerated"
              min="0"
              max="300"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Increasing this number enables longer responses but increases
              latency
            </p>
          </div>

          <div className="mb-6">
            <label className="block mb-2">
              Temperature
              <span className="float-right">
                {values.temperature.toFixed(1)}
              </span>
            </label>
            <Field
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Increasing temperature enables heightened creativity, but
              increases chance of deviation from prompt
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Use Fillers</h3>
              <p className="text-sm text-gray-500">
                Filler words reduce perceived latency, but recipients can feel
                that the AI agent is not letting them complete their sentence
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <Field
                type="checkbox"
                name="useFillers"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="mb-6">
            <button
              type="submit"
              disabled={!dirty || isSubmitting}
              className={`bottom-6 right-6 ${
                dirty && !isSubmitting
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              } text-white font-bold py-2 px-4 rounded-md flex items-center`}
            >
              <Save size={20} className="mr-2" />
              Save
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LLMSettings;
