/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { AppStatus, ChatMessage } from './types';
import * as geminiService from './services/geminiService';
import Spinner from './components/Spinner';
import WelcomeScreen from './components/WelcomeScreen';
import ProgressBar from './components/ProgressBar';
import ChatInterface from './components/ChatInterface';

// DO: Define the AIStudio interface to resolve a type conflict where `window.aistudio` was being redeclared with an anonymous type.
// FIX: Moved the AIStudio interface definition inside the `declare global` block to resolve a TypeScript type conflict.
declare global {
    interface AIStudio {
        openSelectKey: () => Promise<void>;
        hasSelectedApiKey: () => Promise<boolean>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.Initializing);
    const [isAistudioAvailable, setIsAistudioAvailable] = useState(false);
    const [isAistudioKeySelected, setIsAistudioKeySelected] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number, message?: string, fileName?: string } | null>(null);
    const [activeRagStoreName, setActiveRagStoreName] = useState<string | null>(() => localStorage.getItem('ragStoreName'));
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('chatHistory') || '[]');
        } catch (e) {
            return [];
        }
    });
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [exampleQuestions, setExampleQuestions] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('exampleQuestions') || '[]');
        } catch (e) {
            return [];
        }
    });
    const [documentName, setDocumentName] = useState<string>(() => localStorage.getItem('documentName') || '');
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        const isAvailable = !!window.aistudio?.hasSelectedApiKey && !!window.aistudio?.openSelectKey;
        setIsAistudioAvailable(isAvailable);
    }, []);
    
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
        } else {
            localStorage.removeItem('geminiApiKey');
        }
    }, [apiKey]);
    
    useEffect(() => {
        if (activeRagStoreName) {
            localStorage.setItem('ragStoreName', activeRagStoreName);
            localStorage.setItem('documentName', documentName);
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('exampleQuestions', JSON.stringify(exampleQuestions));
        } else {
            localStorage.removeItem('ragStoreName');
            localStorage.removeItem('documentName');
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('exampleQuestions');
        }
    }, [activeRagStoreName, documentName, chatHistory, exampleQuestions]);

    const checkAistudioApiKey = useCallback(async () => {
        if (isAistudioAvailable) {
            try {
                const hasKey = await window.aistudio!.hasSelectedApiKey();
                setIsAistudioKeySelected(hasKey);
            } catch (e) {
                console.error("Errore nel controllo della chiave API:", e);
                setIsAistudioKeySelected(false);
            }
        }
    }, [isAistudioAvailable]);
    
    const isApiKeyConfigured = isAistudioAvailable ? isAistudioKeySelected : apiKey.trim() !== '';

    useEffect(() => {
        const initialize = async () => {
            await checkAistudioApiKey();
            const storedRagStore = localStorage.getItem('ragStoreName');
            // Use a separate variable to check the latest state of isApiKeyConfigured
            const keyConfigured = isAistudioAvailable ? (await window.aistudio?.hasSelectedApiKey()) : (localStorage.getItem('geminiApiKey') || '').trim() !== '';

            if (storedRagStore && keyConfigured) {
                try {
                     geminiService.initialize(isAistudioAvailable ? undefined : apiKey || localStorage.getItem('geminiApiKey')!);
                     setStatus(AppStatus.Chatting);
                } catch(err) {
                     // If init fails, clear session and go to welcome
                     localStorage.removeItem('ragStoreName');
                     setStatus(AppStatus.Welcome);
                }
            } else {
                setStatus(AppStatus.Welcome);
            }
        };
        initialize();
    }, [isAistudioAvailable, apiKey]);


    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkAistudioApiKey();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', checkAistudioApiKey);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', checkAistudioApiKey);
        };
    }, [checkAistudioApiKey]);

    const handleError = (message: string, err: any) => {
        console.error(message, err);
        setError(`${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ''}`);
        setStatus(AppStatus.Error);
    };

    const clearError = () => {
        setError(null);
        setStatus(AppStatus.Welcome);
    }

    const handleSelectKey = async () => {
        if (isAistudioAvailable) {
            try {
                await window.aistudio!.openSelectKey();
                await checkAistudioApiKey();
            } catch (err) {
                console.error("Impossibile aprire il dialogo di selezione della chiave API", err);
            }
        }
    };

    const handleUploadAndStartChat = async () => {
        if (!isApiKeyConfigured) {
            setApiKeyError("È richiesta una Chiave API Gemini per continuare.");
            throw new Error("È richiesta la Chiave API.");
        }
        if (files.length === 0) return;
        
        setApiKeyError(null);

        try {
            geminiService.initialize(isAistudioAvailable ? undefined : apiKey);
        } catch (err) {
            handleError("Inizializzazione fallita. Assicurati che la tua chiave API sia valida.", err);
            throw err;
        }
        
        setStatus(AppStatus.Uploading);
        const totalSteps = files.length + 2;
        setUploadProgress({ current: 0, total: totalSteps, message: "Creazione dell'indice del documento..." });

        try {
            const storeName = `chat-session-${Date.now()}`;
            const ragStoreName = await geminiService.createRagStore(storeName);
            
            setUploadProgress({ current: 1, total: totalSteps, message: "Generazione degli incorporamenti..." });

            for (let i = 0; i < files.length; i++) {
                setUploadProgress(prev => ({ 
                    ...(prev!),
                    current: i + 1,
                    message: "Generazione degli incorporamenti...",
                    fileName: `(${i + 1}/${files.length}) ${files[i].name}`
                }));
                await geminiService.uploadToRagStore(ragStoreName, files[i]);
            }
            
            setUploadProgress({ current: files.length + 1, total: totalSteps, message: "Generazione di suggerimenti...", fileName: "" });
            const questions = await geminiService.generateExampleQuestions(ragStoreName);
            setExampleQuestions(questions);

            setUploadProgress({ current: totalSteps, total: totalSteps, message: "Tutto pronto!", fileName: "" });
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Short delay to show "All set!"

            let docName = '';
            if (files.length === 1) {
                docName = files[0].name;
            } else if (files.length === 2) {
                docName = `${files[0].name} e ${files[1].name}`;
            } else {
                docName = `${files.length} documenti`;
            }
            setDocumentName(docName);
            
            setChatHistory([]); // Start with a fresh chat history
            setActiveRagStoreName(ragStoreName);
            setStatus(AppStatus.Chatting);
            setFiles([]); // Clear files on success
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
            if (errorMessage.includes('api key not valid') || errorMessage.includes('requested entity was not found')) {
                setApiKeyError("La Chiave API Gemini non è valida.");
                if (isAistudioAvailable) setIsAistudioKeySelected(false);
                setStatus(AppStatus.Welcome);
            } else {
                handleError("Impossibile avviare la sessione di chat", err);
            }
            throw err;
        } finally {
            setUploadProgress(null);
        }
    };

    const handleEndChat = () => {
        if (activeRagStoreName) {
            geminiService.deleteRagStore(activeRagStoreName).catch(err => {
                console.error("Impossibile eliminare l'archivio RAG in background", err);
            });
        }
        setActiveRagStoreName(null);
        setChatHistory([]);
        setExampleQuestions([]);
        setDocumentName('');
        setFiles([]);
        setStatus(AppStatus.Welcome);
    };

    const handleSendMessage = async (message: string) => {
        if (!activeRagStoreName) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatHistory(prev => [...prev, userMessage]);
        setIsQueryLoading(true);

        try {
            const result = await geminiService.fileSearch(activeRagStoreName, message);
            const modelMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: result.text }],
                groundingChunks: result.groundingChunks
            };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (err) {
            const errorMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: "Spiacente, ho riscontrato un errore. Riprova." }]
            };
            setChatHistory(prev => [...prev, errorMessage]);
            handleError("Impossibile ottenere una risposta", err);
        } finally {
            setIsQueryLoading(false);
        }
    };
    
    const renderContent = () => {
        switch(status) {
            case AppStatus.Initializing:
                return (
                    <div className="flex items-center justify-center h-full">
                        <Spinner /> <span className="ml-4 text-xl">Inizializzazione...</span>
                    </div>
                );
            case AppStatus.Welcome:
                 return <WelcomeScreen 
                    onUpload={handleUploadAndStartChat} 
                    apiKeyError={apiKeyError} 
                    files={files} 
                    setFiles={setFiles} 
                    isApiKeySelected={isApiKeyConfigured} 
                    onSelectKey={handleSelectKey} 
                    isAistudioAvailable={isAistudioAvailable}
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                />;
            case AppStatus.Uploading:
                let icon = null;
                if (uploadProgress?.message === "Creazione dell'indice del documento...") {
                    icon = <img src="https://services.google.com/fh/files/misc/applet-upload.png" alt="Uploading files icon" className="h-80 w-80 rounded-lg object-cover" />;
                } else if (uploadProgress?.message === "Generazione degli incorporamenti...") {
                    icon = <img src="https://services.google.com/fh/files/misc/applet-creating-embeddings_2.png" alt="Creating embeddings icon" className="h-240 w-240 rounded-lg object-cover" />;
                } else if (uploadProgress?.message === "Generazione di suggerimenti...") {
                    icon = <img src="https://services.google.com/fh/files/misc/applet-suggestions_2.png" alt="Generating suggestions icon" className="h-240 w-240 rounded-lg object-cover" />;
                } else if (uploadProgress?.message === "Tutto pronto!") {
                    icon = <img src="https://services.google.com/fh/files/misc/applet-completion_2.png" alt="Completion icon" className="h-240 w-240 rounded-lg object-cover" />;
                }

                return <ProgressBar 
                    progress={uploadProgress?.current || 0} 
                    total={uploadProgress?.total || 1} 
                    message={uploadProgress?.message || "Preparazione della tua chat..."} 
                    fileName={uploadProgress?.fileName}
                    icon={icon}
                />;
            case AppStatus.Chatting:
                return <ChatInterface 
                    documentName={documentName}
                    history={chatHistory}
                    isQueryLoading={isQueryLoading}
                    onSendMessage={handleSendMessage}
                    onNewChat={handleEndChat}
                    exampleQuestions={exampleQuestions}
                />;
            case AppStatus.Error:
                 return (
                    <div className="flex flex-col items-center justify-center h-full bg-red-900/50 text-red-300">
                        <h1 className="text-3xl font-bold mb-4">Errore dell'applicazione</h1>
                        <p className="max-w-md text-center mb-4">{error}</p>
                        <button onClick={clearError} className="px-4 py-2 rounded-md bg-hitech-surface hover:bg-hitech-surface-hover transition-colors" title="Return to the welcome screen">
                           Riprova
                        </button>
                    </div>
                );
            default:
                 return <WelcomeScreen 
                    onUpload={handleUploadAndStartChat} 
                    apiKeyError={apiKeyError} 
                    files={files} 
                    setFiles={setFiles} 
                    isApiKeySelected={isApiKeyConfigured} 
                    onSelectKey={handleSelectKey} 
                    isAistudioAvailable={isAistudioAvailable}
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                />;
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-hitech-dark text-hitech-text-primary">
            <main className="flex-grow flex flex-col">
                {renderContent()}
            </main>
            <footer className="text-center p-4 text-sm text-hitech-text-secondary border-t border-hitech-border">
                <a href="https://www.theround.it" target="_blank" rel="noopener noreferrer" className="hover:text-hitech-accent-hover transition-colors">©2025 THE ROUND</a>
            </footer>
        </div>
    );
};

export default App;