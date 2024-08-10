import React from "react";
import { ChevronDown, Save } from "lucide-react";
import { Formik, Form, Field } from "formik";

const CallProvider = () => {
  const initialValues = {
    provider: "Twilio",
    hangupLogic: "Call hangs up on silence for 10 seconds",
    hangupTime: 10,
    terminationLogic: "The call ends after 90 seconds of call time",
    terminationTime: 90,
  };

  const handleSubmit = (values, { setSubmitting }) => {
    // Handle form submission here
    console.log(values);
    setSubmitting(false);
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, dirty, isSubmitting, setFieldValue }) => (
        <Form className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Provider</h2>
            <div className="relative">
              <Field
                as="select"
                name="provider"
                className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
              >
                <option>Twilio</option>
                {/* Add more options as needed */}
              </Field>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Call hangup logic</h2>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Field
                  as="select"
                  name="hangupLogic"
                  className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
                >
                  <option>Call hangs up on silence for 10 seconds</option>
                  {/* Add more options as needed */}
                </Field>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown size={20} />
                </div>
              </div>
              <div className="flex-shrink-0 w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (seconds)
                </label>
                <Field
                  type="range"
                  name="hangupTime"
                  min="0"
                  max="60"
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">
                  {values.hangupTime}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Call Termination</h2>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Field
                  as="select"
                  name="terminationLogic"
                  className="w-full p-2 border rounded-md appearance-none bg-white pr-8"
                >
                  <option>The call ends after 90 seconds of call time</option>
                  {/* Add more options as needed */}
                </Field>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown size={20} />
                </div>
              </div>
              <div className="flex-shrink-0 w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (seconds)
                </label>
                <Field
                  type="range"
                  name="terminationTime"
                  min="0"
                  max="300"
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">
                  {values.terminationTime}
                </div>
              </div>
            </div>
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

export default CallProvider;
