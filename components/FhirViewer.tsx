
import React, { useState } from 'react';
import { CopyIcon, CheckIcon, SaveIcon } from './icons';

interface FhirViewerProps {
  fhirJson: string; // The generated FHIR JSON data to display.
  isSaved: boolean; // Flag to indicate if the data has been "saved".
  onSave: () => void; // Callback function to trigger the save process.
  fileName: string; // The original name of the uploaded file, used for download.
}

/**
 * A component to display the generated FHIR JSON in a formatted <pre> block,
 * with actions to copy, download, or save the data.
 */
const FhirViewer: React.FC<FhirViewerProps> = ({ fhirJson, isSaved, onSave, fileName }) => {
  // State to provide visual feedback when the copy button is clicked.
  const [copied, setCopied] = useState(false);

  /**
   * Copies the FHIR JSON content to the user's clipboard.
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(fhirJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
  };
  
  /**
   * Triggers a browser download of the FHIR JSON content as a .json file.
   */
  const handleDownload = () => {
    const blob = new Blob([fhirJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^/.]+$/, "") + "_fhir.json"; // Append suffix
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col h-[75vh]">
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-200">Generated FHIR Resource</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
            title={copied ? "Copied!" : "Copy JSON"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Download
          </button>
          <button
            onClick={onSave}
            disabled={isSaved}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon />
            {isSaved ? 'Saved' : 'Save to FHIR DB'}
          </button>
        </div>
      </div>
      {/* Scrollable container for the JSON content */}
      <div className="p-4 overflow-auto flex-grow">
        <pre className="text-sm bg-slate-900/50 p-4 rounded-md h-full overflow-auto">
          <code>{fhirJson}</code>
        </pre>
      </div>
    </div>
  );
};

export default FhirViewer;
