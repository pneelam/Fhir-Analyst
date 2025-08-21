import React, { useState, useCallback } from 'react';
import { AppState, ChatMessage, AnalyticsData } from './types';
import { convertToFhir, generateAnalytics, answerQuestion, testOllamaConnection, OllamaCorsError, OllamaServerError } from './services/geminiService';
import { convertFileToBase64 } from './utils/fileUtils';

import FileUpload from './components/FileUpload';
import FhirViewer from './components/FhirViewer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Chatbot from './components/Chatbot';
import Loader from './components/Loader';
import { HeaderIcon, WarningIcon, HelpIcon, LoaderIcon as SmallLoaderIcon } from './components/icons';

/**
 * The main application component.
 * Manages the overall application state and flow, from file upload to data analysis and chat.
 */
const App: React.FC = () => {
  // --- STATE MANAGEMENT ---

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<Error | null>(null);
  const [ollamaError, setOllamaError] = useState<OllamaCorsError | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fhirJson, setFhirJson] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics'>('chat');
  
  // State for the interactive Ollama error screen
  const [errorTab, setErrorTab] = useState<'cli' | 'desktop'>('cli');
  const [copied, setCopied] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');


  // --- HANDLER FUNCTIONS ---
  const handleReset = () => {
    setAppState(AppState.IDLE);
    setError(null);
    setOllamaError(null);
    setFile(null);
    setFhirJson(null);
    setAnalyticsData(null);
    setChatHistory([]);
    setIsSaved(false);
    setActiveTab('chat');
    setTestState('idle');
  };

  const handleError = (err: unknown) => {
    console.error(err);
    if (err instanceof OllamaCorsError) {
        setOllamaError(err);
    } else if (err instanceof OllamaServerError) {
        setError(err);
    }
    else {
        setError(err instanceof Error ? err : new Error('An unknown error occurred.'));
    }
    setAppState(AppState.ERROR);
  }

  const handleFileConvert = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setAppState(AppState.CONVERTING);
      setError(null);
      setOllamaError(null);
      setTestState('idle');
      setIsSaved(false);
      setChatHistory([]);

      const base64Data = await convertFileToBase64(selectedFile);
      const generatedJson = await convertToFhir(base64Data, selectedFile.type);
      
      // Validate that the output is parsable JSON before proceeding
      JSON.parse(generatedJson);
      
      setFhirJson(generatedJson);
      setAppState(AppState.CONVERTED);
    } catch (err) {
      handleError(err);
    }
  };
  
  const handleSaveToFhir = useCallback(async () => {
    if (!fhirJson) return;
    setAppState(AppState.ANALYZING);
    
    try {
      const data = await generateAnalytics(fhirJson);
      setAnalyticsData(data);
      setIsSaved(true);
      setAppState(AppState.SAVED);
      const initialBotMessage: ChatMessage = {
        sender: 'bot',
        text: `Data has been processed and is ready for analysis. I am an AI assistant ready to answer questions about this FHIR data. What would you like to know?`,
      };
      setChatHistory([initialBotMessage]);
    } catch (err) {
        handleError(err);
    }
  }, [fhirJson]);

  const handleSendMessage = async (message: string) => {
    if (!fhirJson) return;

    const userMessage: ChatMessage = { sender: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setAppState(AppState.CHATTING);

    try {
      const botResponseText = await answerQuestion(fhirJson, [...chatHistory, userMessage]);
      const botMessage: ChatMessage = { sender: 'bot', text: botResponseText };
      setChatHistory(prev => [...prev, botMessage]);
      setAppState(AppState.SAVED);
    } catch (err) {
      console.error(err);
      const errorMessageText = err instanceof Error ? err.message : "Sorry, I encountered an error while processing your request.";
      const errorMessage: ChatMessage = { sender: 'bot', text: errorMessageText };
      setChatHistory(prev => [...prev, errorMessage]);
      // Do not set global error state for chat failures, just show in chat
      setAppState(AppState.SAVED); 
    }
  };
  
  const handleTestConnection = async () => {
    setTestState('testing');
    const isConnected = await testOllamaConnection();
    if (isConnected) {
      setTestState('success');
      setTimeout(() => {
        if (file) handleFileConvert(file);
      }, 1000);
    } else {
      setTestState('failed');
      setTimeout(() => setTestState('idle'), 2000);
    }
  };


  // --- RENDER LOGIC ---
  const renderOllamaErrorContent = () => {
    if (!ollamaError) return null;
    const instructions = errorTab === 'cli' ? ollamaError.details.cli : ollamaError.details.desktop;
    
    return (
        <div className="text-center p-6 sm:p-8 bg-slate-800 border border-amber-500/30 rounded-lg max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <WarningIcon />
                 <h2 className="text-2xl font-semibold text-amber-400">Connection Guide: Configure Your Ollama Server</h2>
            </div>

            <div className="bg-amber-900/20 text-amber-200 text-sm p-3 rounded-md my-6 text-left">
                <p><strong>This is a one-time setup step for your local Ollama server.</strong></p>
                <p className="mt-1 text-amber-300/80">For security, web browsers block web pages from talking to local services like Ollama by default. You need to explicitly tell Ollama it's okay to accept connections from this app. Please follow the guide below.</p>
            </div>

            <div className="text-left mt-6">
                <div className="border-b border-slate-600 mb-4">
                    <button onClick={() => setErrorTab('cli')} className={`px-4 py-2 text-sm font-medium transition-colors ${errorTab === 'cli' ? 'border-b-2 border-sky-400 text-sky-400' : 'text-slate-400'}`}>Command Line</button>
                    <button onClick={() => setErrorTab('desktop')} className={`px-4 py-2 text-sm font-medium transition-colors ${errorTab === 'desktop' ? 'border-b-2 border-sky-400 text-sky-400' : 'text-slate-400'}`}>Desktop App</button>
                </div>

                <div className="space-y-4 text-slate-300 p-2">
                    {instructions.steps.map((step, index) => <div key={index} dangerouslySetInnerHTML={{ __html: step }}></div>)}
                </div>

                {instructions.command && (
                    <div className="mt-4 bg-slate-900 rounded-md p-3 flex items-center justify-between">
                        <pre className="text-sky-300 font-mono text-sm overflow-x-auto"><code>{instructions.command}</code></pre>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(instructions.command!);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2 justify-center"><HelpIcon/> Further Troubleshooting</h3>
                <ul className="text-sm text-slate-400 space-y-2 text-left list-disc list-inside">
                    {ollamaError.details.troubleshooting.map((item, index) => <li key={index} dangerouslySetInnerHTML={{ __html: item }}></li>)}
                </ul>
            </div>
            
            <div className="mt-8">
                 <p className="text-sm text-slate-400 mb-4">After applying the fix, click the button below to test the connection and restart the process.</p>
                 <button
                    onClick={handleTestConnection}
                    disabled={testState === 'testing' || testState === 'success'}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    {testState === 'testing' && <SmallLoaderIcon />}
                    {testState === 'success' && 'Success! Retrying...'}
                    {testState === 'failed' && 'Connection Failed. Check Steps.'}
                    {testState === 'idle' && "I've Restarted Ollama, Test Connection & Try Again"}
                </button>
            </div>
        </div>
    );
};

  const renderGenericErrorContent = () => {
    return (
        <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4">
                 <WarningIcon />
                 <h2 className="text-2xl font-semibold text-red-400">An Error Occurred</h2>
            </div>
            <p className="mt-4 text-slate-300 whitespace-pre-wrap text-left bg-slate-800/50 p-4 rounded-md font-mono text-sm">
                {error?.message || 'An unknown error occurred.'}
            </p>
            <button
                onClick={handleReset}
                className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-md font-semibold transition-colors"
            >
                Start Over
            </button>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <HeaderIcon />
            <h1 className="text-2xl sm:text-3xl font-bold text-sky-400">FHIR Data Converter & Analyst</h1>
          </div>
          {(appState !== AppState.IDLE) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
            >
              Start Over
            </button>
          )}
        </header>

        <main>
          {appState === AppState.IDLE && (
            <FileUpload onFileSelect={handleFileConvert} />
          )}

          {(appState === AppState.CONVERTING || appState === AppState.ANALYZING) && (
             <div className="text-center p-8 bg-slate-800 rounded-lg">
                <Loader />
                <p className="mt-4 text-lg animate-pulse">
                    {appState === AppState.CONVERTING ? `Converting ${file?.name}...` : 'Analyzing FHIR data...'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                    {appState === AppState.CONVERTING ? "AI is transforming your file into a standard FHIR resource." : "AI is extracting key insights for visualization."}
                </p>
            </div>
          )}

          {appState === AppState.ERROR && (ollamaError ? renderOllamaErrorContent() : renderGenericErrorContent())}
          
          {(appState === AppState.CONVERTED || appState === AppState.SAVED || appState === AppState.CHATTING) && fhirJson && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FhirViewer
                fhirJson={fhirJson}
                isSaved={isSaved}
                onSave={handleSaveToFhir}
                fileName={file?.name || 'converted_data.json'}
              />
              <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col">
                {!isSaved ? (
                  <div className="flex-grow flex items-center justify-center p-4">
                    <p className="text-center text-slate-400">
                      Please save the FHIR resource to enable analytics and Q&A features.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex border-b border-slate-700">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                          activeTab === 'chat' ? 'bg-slate-700/50 text-sky-400' : 'text-slate-400 hover:bg-slate-700/30'
                        }`}
                      >
                        Q&A Chat
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                          activeTab === 'analytics' ? 'bg-slate-700/50 text-sky-400' : 'text-slate-400 hover:bg-slate-700/30'
                        }`}
                      >
                        Analytics
                      </button>
                    </div>
                    <div className="flex-grow p-4 min-h-0">
                      {activeTab === 'chat' ? (
                        <Chatbot
                          history={chatHistory}
                          onSendMessage={handleSendMessage}
                          isLoading={appState === AppState.CHATTING}
                        />
                      ) : (
                        <AnalyticsDashboard data={analyticsData} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;