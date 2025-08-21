
/**
 * Defines the possible states of the application, controlling UI flow.
 */
export enum AppState {
  IDLE,         // Waiting for user to upload a file
  CONVERTING,   // File is being uploaded and converted by the AI
  CONVERTED,    // Conversion is successful, showing FHIR JSON
  ANALYZING,    // FHIR data is being analyzed to generate insights
  SAVED,        // Data is "saved", analytics and chat are enabled
  CHATTING,     // User is interacting with the chatbot (bot is "thinking")
  ERROR,        // An error occurred during one of the processes
}

/**
 * Represents a single message in the chat history.
 */
export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

/**
 * Defines the structure for the analytics data extracted from the FHIR resource.
 */
export interface AnalyticsData {
  patientInfo?: {
    gender?: string;
    birthDate?: string;
    age?: number;
    maritalStatus?: string;
  };
  keyObservations?: Array<{
    name: string;
    value: string | number;
    unit?: string;
    date?: string;
  }>;
  conditions?: string[];
  medications?: string[];
}
