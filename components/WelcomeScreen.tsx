/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import UploadCloudIcon from './icons/UploadCloudIcon';
import TrashIcon from './icons/TrashIcon';

interface WelcomeScreenProps {
    onUpload: () => Promise<void>;
    apiKeyError: string | null;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isApiKeySelected: boolean;
    onSelectKey: () => Promise<void>;
    isAistudioAvailable: boolean;
    apiKey: string;
    setApiKey: React.Dispatch<React.SetStateAction<string>>;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUpload, apiKeyError, files, setFiles, isApiKeySelected, onSelectKey, isAistudioAvailable, apiKey, setApiKey }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
        }
    }, [setFiles]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleConfirmUpload = async () => {
        try {
            await onUpload();
        } catch (error) {
            // Error is handled by the parent component, but we catch it here
            // to prevent an "uncaught promise rejection" warning in the console.
            console.error("Upload process failed:", error);
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleSelectKeyClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await onSelectKey();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-3xl text-center">
                <h1 className="text-4xl sm:text-5xl font-bold mb-8">Chatta con il tuo Documento</h1>

                {!isApiKeySelected && (
                    <div className="w-full max-w-xl mx-auto mb-8 text-left">
                        <div className="bg-hitech-surface border border-hitech-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-hitech-text-primary">Passo 1: Fornisci una Chiave API Gemini</h3>
                            {isAistudioAvailable ? (
                                <>
                                    {isApiKeySelected ? (
                                        <div className="w-full bg-hitech-surface border border-hitech-border rounded-lg py-3 px-5 text-center text-hitech-accent-hover font-semibold">
                                            ✓ Chiave API Selezionata
                                        </div>
                                    ) : (
                                        <div>
                                            <button
                                                onClick={handleSelectKeyClick}
                                                className="w-full bg-hitech-accent hover:bg-hitech-accent-hover text-hitech-dark font-semibold rounded-lg py-3 px-5 text-center focus:outline-none focus:ring-2 focus:ring-hitech-accent"
                                            >
                                                Seleziona la Chiave API Gemini
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                            <>
                                    <label htmlFor="api-key-input" className="sr-only">Chiave API Gemini</label>
                                    <input
                                        id="api-key-input"
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Inserisci la tua Chiave API Gemini"
                                        className="w-full bg-hitech-dark border border-hitech-border rounded-lg py-3 px-5 focus:outline-none focus:ring-2 focus:ring-hitech-accent text-hitech-text-primary"
                                    />
                                    <p className="text-xs text-hitech-text-secondary mt-2 text-center">
                                        La tua chiave API viene memorizzata in modo sicuro nel browser per le visite future.
                                    </p>
                            </>
                            )}
                            {apiKeyError && <p className="text-red-400 text-sm mt-2 text-center">{apiKeyError}</p>}
                        </div>
                    </div>
                )}
                
                <div className={`transition-opacity ${!isApiKeySelected ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="text-left max-w-xl mx-auto mb-4">
                      <h3 className="text-lg font-semibold text-hitech-text-primary">Passo 2: Carica Documenti</h3>
                    </div>

                    <div 
                        className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors mb-6 max-w-xl mx-auto ${isDragging ? 'border-hitech-accent bg-hitech-accent/10' : 'border-hitech-border'}`}
                        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <UploadCloudIcon />
                            <p className="mt-4 text-lg text-hitech-text-secondary">Trascina qui i tuoi file PDF, .txt, o .md.</p>
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md"/>
                             <label 
                                htmlFor="file-upload" 
                                className="mt-4 cursor-pointer px-6 py-2 bg-hitech-accent text-hitech-dark rounded-full font-semibold hover:bg-hitech-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-hitech-dark focus:ring-hitech-accent" 
                                title="Seleziona file dal tuo dispositivo"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        (document.getElementById('file-upload') as HTMLInputElement)?.click();
                                    }
                                }}
                             >
                                O Sfoglia File
                            </label>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="w-full max-w-xl mx-auto mb-6 text-left">
                            <h4 className="font-semibold mb-2">File Selezionati ({files.length}):</h4>
                            <ul className="max-h-36 overflow-y-auto space-y-1 pr-2">
                                {files.map((file, index) => (
                                    <li key={`${file.name}-${index}`} className="text-sm bg-hitech-surface/50 p-2 rounded-md flex justify-between items-center group">
                                        <span className="truncate" title={file.name}>{file.name}</span>
                                        <div className="flex items-center flex-shrink-0">
                                            <span className="text-xs text-hitech-text-secondary/50 ml-2">{(file.size / 1024).toFixed(2)} KB</span>
                                            <button 
                                                onClick={() => handleRemoveFile(index)}
                                                className="ml-2 p-1 text-red-400 hover:text-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label={`Rimuovi ${file.name}`}
                                                title="Rimuovi questo file"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="w-full max-w-xl mx-auto">
                        {files.length > 0 && (
                            <button 
                                onClick={handleConfirmUpload}
                                disabled={!isApiKeySelected}
                                className="w-full px-6 py-3 rounded-md bg-hitech-accent hover:bg-hitech-accent-hover text-hitech-dark font-bold transition-colors disabled:bg-hitech-border/50 disabled:cursor-not-allowed"
                                title={!isApiKeySelected ? "Per favore, fornisci prima una chiave API" : "Avvia la sessione di chat con i file selezionati"}
                            >
                                Carica e Chatta
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;