/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import TrashIcon from './icons/TrashIcon';

interface WelcomeScreenProps {
    onUpload: () => Promise<void>;
    apiKeyError: string | null;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isApiKeySelected: boolean;
    onSelectKey: () => Promise<void>;
    isAistudioAvailable: boolean;
}

const sampleDocuments = [
    {
        name: 'Manuale Hyundai i10',
        details: '562 pagine, PDF',
        url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
        icon: <CarIcon />,
        fileName: 'hyundai-i10-manual.pdf'
    },
    {
        name: 'Manuale Lavatrice LG',
        details: '36 pagine, PDF',
        url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
        icon: <WashingMachineIcon />,
        fileName: 'lg-washer-manual.pdf'
    }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUpload, apiKeyError, files, setFiles, isApiKeySelected, onSelectKey, isAistudioAvailable }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

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

    const handleSelectSample = async (name: string, url: string, fileName: string) => {
        if (loadingSample) return;
        setLoadingSample(name);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Impossibile recuperare ${name}: ${response.statusText}. Potrebbe essere un problema di CORS.`);
            }
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });
            setFiles(prev => [...prev, file]);
        } catch (error) {
            console.error("Errore nel recuperare il file di esempio:", error);
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                alert(`Impossibile recuperare il documento di esempio. Prova a caricare un file locale.`);
            }
        } finally {
            setLoadingSample(null);
        }
    };

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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-3xl text-center">
                <h1 className="text-4xl sm:text-5xl font-bold mb-2">Chatta con il tuo Documento</h1>
                <p className="text-gem-offwhite/70 mb-8">
                    Con la tecnologia di <strong className="font-semibold text-gem-offwhite">FileSearch</strong>. Carica un manuale o seleziona un esempio per vedere RAG in azione.
                </p>

                <div className="w-full max-w-xl mx-auto mb-8 text-left">
                    <div className="border border-gem-mist/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gem-offwhite">Passo 1: Fornisci una Chiave API Gemini</h3>
                        {isAistudioAvailable ? (
                            <>
                                {isApiKeySelected ? (
                                    <div className="w-full bg-gem-slate border border-gem-mist/50 rounded-lg py-3 px-5 text-center text-gem-teal font-semibold">
                                        ✓ Chiave API Selezionata
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={handleSelectKeyClick}
                                            className="w-full bg-gem-blue hover:bg-blue-500 text-white font-semibold rounded-lg py-3 px-5 text-center focus:outline-none focus:ring-2 focus:ring-gem-blue"
                                        >
                                            Seleziona la Chiave API Gemini
                                        </button>
                                        <p className="text-xs text-gem-offwhite/60 mt-2 text-center">È necessaria una chiave API per utilizzare questa app. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gem-blue">Info sulla fatturazione.</a></p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {isApiKeySelected ? (
                                    <div className="w-full bg-gem-slate border border-gem-mist/50 rounded-lg py-3 px-5 text-center text-gem-teal font-semibold">
                                        ✓ Chiave API Caricata dall'Ambiente
                                    </div>
                                ) : (
                                    <div className="w-full bg-gem-mist/20 border border-gem-mist/50 rounded-lg p-4 text-center">
                                        <p className="font-semibold text-gem-offwhite">Chiave API Gemini non configurata.</p>
                                        <p className="text-xs text-gem-offwhite/60 mt-1">Questa app richiede una chiave API per funzionare. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gem-blue">Info sulla fatturazione.</a></p>
                                    </div>
                                )}
                            </>
                        )}
                        {apiKeyError && <p className="text-red-400 text-sm mt-2 text-center">{apiKeyError}</p>}
                    </div>
                </div>
                
                <div className={`transition-opacity ${!isApiKeySelected ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="text-left max-w-xl mx-auto mb-4">
                      <h3 className="text-lg font-semibold text-gem-offwhite">Passo 2: Carica Documenti</h3>
                    </div>

                    <div 
                        className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors mb-6 max-w-xl mx-auto ${isDragging ? 'border-gem-blue bg-gem-mist/10' : 'border-gem-mist/50'}`}
                        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <UploadCloudIcon />
                            <p className="mt-4 text-lg text-gem-offwhite/80">Trascina qui i tuoi file PDF, .txt, o .md.</p>
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md"/>
                             <label 
                                htmlFor="file-upload" 
                                className="mt-4 cursor-pointer px-6 py-2 bg-gem-blue text-white rounded-full font-semibold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gem-onyx focus:ring-gem-blue" 
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
                                    <li key={`${file.name}-${index}`} className="text-sm bg-gem-mist/50 p-2 rounded-md flex justify-between items-center group">
                                        <span className="truncate" title={file.name}>{file.name}</span>
                                        <div className="flex items-center flex-shrink-0">
                                            <span className="text-xs text-gem-offwhite/50 ml-2">{(file.size / 1024).toFixed(2)} KB</span>
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
                                className="w-full px-6 py-3 rounded-md bg-gem-blue hover:bg-blue-500 text-white font-bold transition-colors disabled:bg-gem-mist/50 disabled:cursor-not-allowed"
                                title={!isApiKeySelected ? "Per favore, fornisci prima una chiave API" : "Avvia la sessione di chat con i file selezionati"}
                            >
                                Carica e Chatta
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center my-8">
                        <div className="flex-grow border-t border-gem-mist"></div>
                        <span className="flex-shrink mx-4 text-gem-offwhite/60">OPPURE</span>
                        <div className="flex-grow border-t border-gem-mist"></div>
                    </div>

                    <div className="text-left mb-4">
                        <p className="text-gem-offwhite/80">Prova un esempio:</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                        {sampleDocuments.map(doc => (
                            <button
                                key={doc.name}
                                onClick={() => handleSelectSample(doc.name, doc.url, doc.fileName)}
                                disabled={!!loadingSample}
                                className="bg-gem-slate p-4 rounded-lg border border-gem-mist/30 hover:border-gem-blue/50 hover:bg-gem-mist/10 transition-all text-left flex items-center space-x-4 disabled:opacity-50 disabled:cursor-wait"
                                title={`Chatta con ${doc.name}`}
                            >
                                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 bg-gem-mist/20 rounded-lg">
                                    {loadingSample === doc.name ? <Spinner /> : doc.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-gem-offwhite">{doc.name}</p>
                                    <p className="text-sm text-gem-offwhite/60">{doc.details}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;