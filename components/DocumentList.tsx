/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { RagStore, Document, CustomMetadata } from '../types';
import Spinner from './Spinner';
import UploadIcon from './icons/UploadIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface DocumentListProps {
    selectedStore: RagStore | null;
    documents: Document[];
    isLoading: boolean;
    processingFile: string | null;
    onUpload: (file: File, metadata: CustomMetadata[]) => void;
    onDelete: (docName: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ selectedStore, documents, isLoading, processingFile, onUpload, onDelete }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);

    const handleUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    const handleModalClose = () => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setMetadata([{ key: '', value: '' }]);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleMetadataChange = (index: number, field: 'key' | 'value', text: string) => {
        const newMetadata = [...metadata];
        newMetadata[index][field] = text;
        setMetadata(newMetadata);
    };

    const addMetadataRow = () => {
        setMetadata([...metadata, { key: '', value: '' }]);
    };

    const removeMetadataRow = (index: number) => {
        const newMetadata = metadata.filter((_, i) => i !== index);
        setMetadata(newMetadata);
    };

    const handleConfirmUpload = () => {
        if (!selectedFile) return;
        const formattedMetadata: CustomMetadata[] = metadata
            .filter(m => m.key.trim() !== '')
            .map(m => ({ key: m.key.trim(), stringValue: m.value.trim() }));
        onUpload(selectedFile, formattedMetadata);
        handleModalClose();
    };

    if (!selectedStore) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center text-hitech-text-secondary">
                <p className="text-lg">Seleziona un Archivio RAG</p>
                <p>per visualizzare e gestire i suoi documenti.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold truncate" title={selectedStore.displayName}>Documenti</h2>
                <button
                    onClick={handleUploadClick}
                    className="p-2 bg-hitech-accent hover:bg-hitech-accent-hover rounded-full text-hitech-dark transition-colors disabled:bg-hitech-border disabled:cursor-not-allowed"
                    disabled={!!processingFile}
                    aria-label="Carica documento"
                    title="Carica un nuovo documento in questo archivio"
                >
                    <UploadIcon />
                </button>
            </div>
            
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="upload-doc-title">
                    <div className="bg-hitech-surface p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 id="upload-doc-title" className="text-xl font-bold mb-4">Carica Documento</h3>
                        
                        <div className="mb-4">
                            <label htmlFor="file-upload" className="block text-sm font-medium text-hitech-text-secondary mb-2">File</label>
                            <input
                                id="file-upload"
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="w-full text-sm text-hitech-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-hitech-accent file:text-hitech-dark hover:file:bg-hitech-accent-hover"
                            />
                            {selectedFile && <p className="text-sm mt-2 text-hitech-text-secondary/70">Selezionato: {selectedFile.name}</p>}
                        </div>

                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-hitech-text-secondary mb-2">Metadati Personalizzati (opzionale)</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {metadata.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input type="text" placeholder="Chiave" value={item.key} onChange={(e) => handleMetadataChange(index, 'key', e.target.value)} className="w-1/2 bg-hitech-dark border border-hitech-border rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-hitech-accent" />
                                        <input type="text" placeholder="Valore" value={item.value} onChange={(e) => handleMetadataChange(index, 'value', e.target.value)} className="w-1/2 bg-hitech-dark border border-hitech-border rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-hitech-accent" />
                                        <button onClick={() => removeMetadataRow(index)} className="p-1 text-red-400 hover:text-red-300 rounded-full" aria-label="Rimuovi riga metadati" title="Rimuovi riga metadati">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addMetadataRow} className="mt-2 flex items-center text-sm text-hitech-accent hover:text-hitech-accent-hover" title="Aggiungi un altro campo metadati">
                                <PlusIcon /> <span className="ml-1">Aggiungi Metadati</span>
                            </button>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-6">
                            <button type="button" onClick={handleModalClose} className="px-4 py-2 rounded-md bg-hitech-surface-hover hover:bg-hitech-border transition-colors" title="Annulla caricamento">
                                Annulla
                            </button>
                            <button type="button" onClick={handleConfirmUpload} disabled={!selectedFile} className="px-4 py-2 rounded-md bg-hitech-accent hover:bg-hitech-accent-hover text-hitech-dark font-semibold transition-colors disabled:bg-hitech-border/50 disabled:cursor-not-allowed" title="Carica file selezionato">
                                Carica
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {processingFile && (
                <div className="mb-4 p-3 bg-hitech-surface rounded-md flex items-center">
                    <Spinner />
                    <span className="ml-3">Elaborazione: {processingFile}...</span>
                </div>
            )}
            {isLoading && !documents.length ? (
                <div className="flex-grow flex items-center justify-center">
                    <Spinner />
                </div>
            ) : documents.length === 0 && !processingFile ? (
                <div className="flex-grow flex items-center justify-center text-center text-hitech-text-secondary">
                    <p>Nessun documento trovato. <br /> Clicca sull'icona di caricamento per aggiungerne uno.</p>
                </div>
            ) : (
                <ul className="space-y-2 overflow-y-auto">
                    {documents.map((doc) => (
                        <li key={doc.name} className="p-3 bg-hitech-surface rounded-md group">
                             <div className="flex items-center justify-between">
                                <span className="truncate font-medium" title={doc.displayName}>{doc.displayName}</span>
                                <button 
                                    onClick={() => onDelete(doc.name)}
                                    className="ml-2 p-1 text-red-400 hover:text-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Elimina ${doc.displayName}`}
                                    title={`Elimina ${doc.displayName}`}
                                >
                                <TrashIcon />
                                </button>
                            </div>
                             {doc.customMetadata && doc.customMetadata.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-hitech-border/50 text-xs">
                                    <h4 className="font-semibold text-hitech-text-secondary mb-1">Metadati:</h4>
                                    <dl className="space-y-1">
                                        {doc.customMetadata.map((meta, index) => (
                                            meta.key && (
                                                <div key={index} className="flex">
                                                    <dt className="w-1/3 font-medium text-hitech-text-secondary/80 truncate pr-2" title={meta.key}>{meta.key}</dt>
                                                    <dd className="w-2/3 text-hitech-text-secondary truncate" title={meta.stringValue}>{meta.stringValue}</dd>
                                                </div>
                                            )
                                        ))}
                                    </dl>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DocumentList;