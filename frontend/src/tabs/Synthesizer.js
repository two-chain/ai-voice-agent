import React from "react";
import { Save } from "lucide-react";
import { Formik, Form, Field } from "formik";

const Synthesizer = () => {
  const initialValues = {
    synthesizer: "Polly",
    voice: "Matthew",
    bufferSize: 148,
    ambientNoise: "No ambient noise",
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, actions) => {
        console.log(values);
        actions.setSubmitting(false);
      }}
    >
      {({ values, dirty, isSubmitting }) => (
        <Form className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Choose Synthesizer</h2>

          <div className="flex space-x-2 mb-6">
            <Field
              as="select"
              name="synthesizer"
              className="flex-1 p-2 border rounded-md bg-white"
            >
              <option>Polly</option>
            </Field>
            <Field
              as="select"
              name="voice"
              className="flex-1 p-2 border rounded-md bg-white"
            >
              <option>Matthew</option>
            </Field>
            <button
              type="button"
              className="px-3 py-2 bg-white border rounded-md flex items-center"
            >
              <span className="mr-1">More voices</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Buffer Size
            </label>
            <Field
              type="range"
              name="bufferSize"
              min="0"
              max="300"
              className="w-full"
            />
            <div className="text-right text-sm text-gray-600">
              {values.bufferSize}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Increasing buffer size enables agent to speak long responses
              fluently, but increases latency
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Ambient Noise
            </label>
            <Field
              as="select"
              name="ambientNoise"
              className="w-full p-2 border rounded-md bg-white"
            >
              <option>No ambient noise</option>
            </Field>
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

export default Synthesizer;
