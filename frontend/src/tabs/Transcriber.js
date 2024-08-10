import React from "react";
import { Save } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  asrProvider: Yup.string().required("ASR Provider is required"),
  language: Yup.string().required("Language is required"),
  endpointing: Yup.number().min(0).max(1000).required(),
  linearDelay: Yup.number().min(0).max(1000).required(),
  wordsBeforeInterrupting: Yup.number().min(0).max(10).required(),
  backchanneling: Yup.boolean(),
  backchannelingStartDelay: Yup.number().min(0).max(10).required(),
  backchannelingMessageGap: Yup.number().min(0).max(10).required(),
});

const Transcriber = () => {
  const initialValues = {
    asrProvider: "",
    language: "English",
    endpointing: 100,
    linearDelay: 450,
    wordsBeforeInterrupting: 1,
    backchanneling: false,
    backchannelingStartDelay: 5,
    backchannelingMessageGap: 5,
  };

  const handleSubmit = (values, { setSubmitting }) => {
    // Handle form submission
    console.log(values);
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, dirty, isValid }) => (
        <Form className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Choose Transcriber</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Field
                as="select"
                name="asrProvider"
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select ASR Provider</option>
                <option value="provider1">Provider 1</option>
                <option value="provider2">Provider 2</option>
              </Field>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">Choose language</h3>
          <Field
            as="select"
            name="language"
            className="w-full p-2 border rounded-md mb-4"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </Field>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Endpointing (in ms)
            </label>
            <Field
              type="range"
              name="endpointing"
              min="0"
              max="1000"
              className="w-full"
            />
            <div className="text-right">{values.endpointing}</div>
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
            <Field
              type="range"
              name="linearDelay"
              min="0"
              max="1000"
              className="w-full"
            />
            <div className="text-right">{values.linearDelay}</div>
            <p className="text-sm text-gray-500 mt-1">
              Linear delay accounts for long pauses mid-sentence. If the
              recipient is expected to speak long sentences, increase value of
              linear delay
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Number of words to wait for before interrupting (in words)
            </label>
            <Field
              type="range"
              name="wordsBeforeInterrupting"
              min="0"
              max="10"
              className="w-full"
            />
            <div className="text-right">{values.wordsBeforeInterrupting}</div>
            <p className="text-sm text-gray-500 mt-1">
              Agent will not consider interruptions until these many words are
              spoken (If recipient says "Stopwords" such as Stop, Wait, Hold On,
              agent will pause by default)
            </p>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <span className="text-sm font-medium mr-2">Backchanneling</span>
              <Field
                type="checkbox"
                name="backchanneling"
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
              <Field
                type="range"
                name="backchannelingStartDelay"
                min="0"
                max="10"
                className="w-full"
              />
              <div className="text-right">
                {values.backchannelingStartDelay}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Backchanneling message gap
              </label>
              <Field
                type="range"
                name="backchannelingMessageGap"
                min="0"
                max="10"
                className="w-full"
              />
              <div className="text-right">
                {values.backchannelingMessageGap}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              type="submit"
              className={`bottom-6 right-6 ${
                dirty && isValid
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              } text-white font-bold py-2 px-4 rounded-md flex items-center`}
              disabled={!dirty || !isValid}
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

export default Transcriber;
