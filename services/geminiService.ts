import { AnalyticsData, ChatMessage } from '../types';

// ====================================================================================
// OLLAMA LOCAL AI SERVICE
// This file connects to a local Ollama instance to perform AI tasks.
// It includes robust error handling for common local server connection issues.
// ====================================================================================

const OLLAMA_ENDPOINT = "http://localhost:11434";
const OLLAMA_MODEL = "llama3";

interface OllamaErrorDetails {
    cli: { steps: string[]; command?: string };
    desktop: { steps: string[]; command?: string };
    troubleshooting: string[];
}

/**
 * A custom error for when the Ollama server responds with a non-200 status code.
 */
export class OllamaServerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OllamaServerError';
        this.message = `The Ollama server responded with an error.\n\nDetails: ${message}\n\nThis usually means the model had an issue processing the request. This can happen with very large or complex files. Please try a different file or check your Ollama server logs for more information.`;
    }
}

/**
 * A custom error class specifically for Ollama connection issues (like CORS).
 * Contains structured, user-friendly instructions to help resolve the problem.
 */
export class OllamaCorsError extends Error {
    public details: OllamaErrorDetails;

    constructor() {
        const message = `Could not connect to the Ollama server at ${OLLAMA_ENDPOINT.replace('/api/generate', '')}.`;
        super(message);
        this.name = 'OllamaCorsError';
        this.details = {
            cli: {
                steps: [
                    "<b>Step 1: Check if Ollama is running.</b> Open a terminal and run <code>curl http://localhost:11434</code>. If you see 'Ollama is running', proceed to Step 2. If you see 'Connection refused', your server is not running.",
                    "<b>Step 2: Stop your current Ollama server</b> (usually with Ctrl+C in its terminal).",
                    "<b>Step 3: Restart the server with the correct command.</b> This command tells Ollama to accept requests from web browsers. Copy and paste it into your terminal:",
                ],
                command: `OLLAMA_ORIGINS='*' ollama serve`
            },
            desktop: {
                steps: [
                    "<b>Step 1: Check if Ollama is running.</b> Open a terminal (Terminal on macOS, PowerShell or Command Prompt on Windows) and run <code>curl http://localhost:11434</code>. If you see 'Ollama is running', proceed to Step 2. If you see 'Connection refused', your server is not running.",
                    "<b>Step 2: Quit the Ollama Desktop application.</b> Make sure the icon is gone from your system tray (Windows) or menu bar (macOS).",
                    "<b>Step 3: Configure the environment variable.</b> This tells Ollama to accept requests from web browsers.",
                    `<ul style="list-style-position: inside; margin-left: 1rem;">
                        <li style="list-style-type: disc;"><b>On Windows:</b> Open Start, search for 'Edit the system environment variables'. Click 'Environment Variables...', then 'New...' under 'System variables'. Name: <code>OLLAMA_ORIGINS</code>, Value: <code>*</code>. Click OK on all windows.</li>
                        <li style="list-style-type: disc;"><b>On macOS:</b> Open the Terminal app and run this command: <code>launchctl setenv OLLAMA_ORIGINS '*'</code></li>
                    </ul>`,
                    "<b><u>Step 4: CRITICAL STEP FOR WINDOWS USERS.</u> You must restart your entire computer for the change to take effect.</b>",
                    "<b>Step 5: Restart the Ollama Desktop application.</b>",
                ],
            },
            troubleshooting: [
                "If you are still having issues, double-check that no firewall or antivirus software is blocking the connection to <code>localhost:11434</code>.",
                "Ensure you have a model pulled by running <code>ollama pull llama3</code> in your terminal.",
                "On macOS, you can verify the variable is set by running <code>launchctl getenv OLLAMA_ORIGINS</code> in a new terminal window."
            ]
        };
    }
}

/**
 * Performs a simple check to see if the Ollama server is reachable.
 * @returns A boolean indicating if a connection was established.
 */
export const testOllamaConnection = async (): Promise<boolean> => {
    try {
        await fetch(OLLAMA_ENDPOINT);
        return true; // Connection successful (even if it's a 404, a connection was made)
    } catch (e) {
        return false; // Connection failed
    }
}

/**
 * A generic function to call the Ollama API with a given prompt.
 * @param prompt The prompt to send to the model.
 * @returns The text response from the model.
 */
const callOllama = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gemma:2b",
                prompt: prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new OllamaServerError(`${response.status} ${response.statusText}`);
        }

        const result = await response?.trim();
        if (result.error) {
            throw new OllamaServerError(`Ollama API Error: ${result.error}`);
        }
        
        return result.response?.trim() || "";

    } catch (err) {
        if (err instanceof OllamaServerError) {
            throw err;
        }
        // A TypeError is the most common indicator of a CORS or network failure.
        if (err instanceof TypeError) {
            throw new OllamaCorsError();
        }
        // Re-throw other errors to be caught by the generic handler
        throw err;
    }
};

/**
 * Cleans the AI's JSON output by removing markdown fences and extraneous text.
 * @param rawJson The raw string output from the AI model.
 * @returns A clean JSON string.
 */
const cleanJsonOutput = (rawJson: string): string => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = rawJson.match(jsonRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    // If no markdown, find the first '{' or '[' and the last '}' or ']'
    const firstBracket = rawJson.indexOf('{');
    const firstSquare = rawJson.indexOf('[');
    let start = -1;

    if (firstBracket === -1 && firstSquare === -1) {
        throw new Error("No JSON object found in the AI response.");
    }
    
    if(firstBracket === -1) start = firstSquare;
    else if (firstSquare === -1) start = firstBracket;
    else start = Math.min(firstBracket, firstSquare);

    const lastBracket = rawJson.lastIndexOf('}');
    const lastSquare = rawJson.lastIndexOf(']');
    const end = Math.max(lastBracket, lastSquare);
    
    if (start === -1 || end === -1) {
         throw new Error("Valid JSON structure not found in the AI response.");
    }

    return rawJson.substring(start, end + 1);
}

/**
 * Uses Ollama to convert file content into a FHIR R4 JSON resource.
 */
export const convertToFhir = async (base64Data: string, mimeType: string): Promise<string> => {
  const prompt = `
    You are an expert in healthcare interoperability, specifically FHIR R4.
    Your task is to convert the content of the provided data into a valid FHIR R4 JSON Bundle resource.
    The data is from a file of type ${mimeType}.
    
    IMPORTANT: Your response MUST be ONLY the raw JSON content of the FHIR Bundle.
    Do not include any explanatory text, comments, markdown code fences (like \`\`\`json\`), or any other text outside of the JSON structure.
    The output must be a single, valid JSON object that can be parsed by JSON.parse().
    Clean the input data if necessary to produce a valid FHIR resource.
    
    Here is the data (it is base64 encoded, but you should treat it as its raw content):
    ${base64Data}
  `;
  
  try {
    const rawResponse = await callOllama(prompt);
    const cleanedJson = cleanJsonOutput(rawResponse);
    JSON.parse(cleanedJson); // Validate JSON
    return cleanedJson;
  } catch (err) {
    if (err instanceof OllamaCorsError || err instanceof OllamaServerError) throw err;
    throw new Error(`The AI model failed to generate a valid FHIR resource. Details: ${(err as Error).message}`);
  }
};

/**
 * Uses Ollama to analyze FHIR JSON and generate structured analytics data.
 */
export const generateAnalytics = async (fhirJson: string): Promise<AnalyticsData> => {
  const prompt = `
    Analyze the following FHIR R4 JSON data.
    Extract the specified information and return it as a valid JSON object.
    
    Your response MUST be ONLY the raw JSON content. Do not include any explanatory text or markdown.
    The JSON object MUST have the following structure:
    {
      "patientInfo": { "gender": string, "birthDate": string, "age": number, "maritalStatus": string },
      "keyObservations": [ { "name": string, "value": string, "unit": string, "date": string } ],
      "conditions": [ string ],
      "medications": [ string ]
    }

    Calculate the patient's current age in years based on their birthDate and today's date.
    For keyObservations, only include the most clinically relevant results (e.g., blood pressure, glucose, BMI, heart rate, weight).
    If a value is not present in the FHIR data, omit the key or use a null value.
    
    FHIR Data:
    ${fhirJson}
  `;

  try {
    const rawResponse = await callOllama(prompt);
    const cleanedJson = cleanJsonOutput(rawResponse);
    return JSON.parse(cleanedJson);
  } catch (err) {
    if (err instanceof OllamaCorsError || err instanceof OllamaServerError) throw err;
    throw new Error(`The AI model failed to generate valid analytics. Details: ${(err as Error).message}`);
  }
};

/**
 * Uses Ollama to answer a question based on the FHIR data and chat history.
 */
export const answerQuestion = async (fhirJson: string, history: ChatMessage[]): Promise<string> => {
  const userQuestion = history[history.length - 1].text;
  
  const prompt = `
    You are a helpful AI assistant providing information from a patient's FHIR electronic health record.
    Your role is to answer the user's question based ONLY on the provided FHIR data below.
    Do not invent or infer information that is not explicitly present in the record.
    If the answer cannot be found in the provided data, you must state that the information is not available in the patient's record.
    Keep your answers concise and directly related to the question.
    
    --- PATIENT FHIR DATA ---
    ${fhirJson}
    --- END OF DATA ---
    
    --- PREVIOUS CONVERSATION ---
    ${history.slice(0, -1).map(msg => `${msg.sender}: ${msg.text}`).join('\n')}
    --- END OF CONVERSATION ---

    --- USER QUESTION ---
    user: ${userQuestion}
    --- END OF QUESTION ---
    
    Answer the user's question based only on the data provided.
  `;
  
  try {
    return await callOllama(prompt);
  } catch (err) {
    if (err instanceof OllamaCorsError || err instanceof OllamaServerError) throw err;
    throw new Error(`The AI model failed to answer the question. Details: ${(err as Error).message}`);
  }
};
