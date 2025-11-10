/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import TypingIndicator from './TypingIndicator';
import SendIcon from './icons/SendIcon';
import RefreshIcon from './icons/RefreshIcon';
import ClearChatIcon from './icons/ClearChatIcon';
import DownloadChatIcon from './icons/DownloadChatIcon';

interface ChatInterfaceProps {
    documentName: string;
    history: ChatMessage[];
    isQueryLoading: boolean;
    onSendMessage: (message: string) => void;
    onNewChat: () => void;
    exampleQuestions: string[];
    onClearChat: () => void;
    onDownloadChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ documentName, history, isQueryLoading, onSendMessage, onNewChat, exampleQuestions, onClearChat, onDownloadChat }) => {
    const [query, setQuery] = useState('');
    const [modalContent, setModalContent] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const renderMarkdown = (text: string) => {
        if (!text) return { __html: '' };

        const lines = text.split('\n');
        let html = '';
        let listType: 'ul' | 'ol' | null = null;
        let paraBuffer = '';

        function flushPara() {
            if (paraBuffer) {
                html += `<p class="my-2">${paraBuffer}</p>`;
                paraBuffer = '';
            }
        }

        function flushList() {
            if (listType) {
                html += `</${listType}>`;
                listType = null;
            }
        }

        for (const rawLine of lines) {
            const line = rawLine
                .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
                .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-hitech-surface/50 px-1 py-0.5 rounded-sm font-mono text-sm">$1</code>');

            const isOl = line.match(/^\s*\d+\.\s(.*)/);
            const isUl = line.match(/^\s*[\*\-]\s(.*)/);

            if (isOl) {
                flushPara();
                if (listType !== 'ol') {
                    flushList();
                    html += '<ol class="list-decimal list-inside my-2 pl-5 space-y-1">';
                    listType = 'ol';
                }
                html += `<li>${isOl[1]}</li>`;
            } else if (isUl) {
                flushPara();
                if (listType !== 'ul') {
                    flushList();
                    html += '<ul class="list-disc list-inside my-2 pl-5 space-y-1">';
                    listType = 'ul';
                }
                html += `<li>${isUl[1]}</li>`;
            } else {
                flushList();
                if (line.trim() === '') {
                    flushPara();
                } else {
                    paraBuffer += (paraBuffer ? '<br/>' : '') + line;
                }
            }
        }

        flushPara();
        flushList();

        return { __html: html };
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSendMessage(query);
            setQuery('');
        }
    };

    const handleSourceClick = (text: string) => {
        setModalContent(text);
    };

    const closeModal = () => {
        setModalContent(null);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isQueryLoading]);

    return (
        <div className="flex flex-col h-full relative">
            <header className="absolute top-0 left-0 right-0 p-4 bg-hitech-dark/80 backdrop-blur-sm z-10 flex justify-between items-center border-b border-hitech-border">
                <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-4">
                    <h1 className="text-2xl font-bold text-hitech-text-primary truncate" title="Chatta con i tuoi documenti">Chatta con i tuoi documenti</h1>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                            onClick={onDownloadChat}
                            className="flex items-center px-4 py-2 bg-hitech-surface hover:bg-hitech-surface-hover rounded-full text-hitech-text-primary font-semibold transition-colors"
                            title="Scarica conversazione"
                        >
                            <DownloadChatIcon />
                            <span className="ml-2 hidden sm:inline">Scarica</span>
                        </button>
                         <button
                            onClick={onClearChat}
                            className="flex items-center px-4 py-2 bg-hitech-surface hover:bg-hitech-surface-hover rounded-full text-hitech-text-primary font-semibold transition-colors"
                            title="Pulisci la chat"
                        >
                            <ClearChatIcon />
                            <span className="ml-2 hidden sm:inline">Pulisci</span>
                        </button>
                        <button
                            onClick={onNewChat}
                            className="flex items-center px-4 py-2 bg-hitech-accent hover:bg-hitech-accent-hover rounded-full text-hitech-dark font-semibold transition-colors"
                            title="Termina la chat attuale e iniziane una nuova"
                        >
                            <RefreshIcon />
                            <span className="ml-2 hidden sm:inline">Nuova Chat</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-grow pt-24 pb-32 overflow-y-auto px-4">
                <div className="w-full max-w-4xl mx-auto space-y-6">
                    {history.length === 0 && exampleQuestions.length > 0 && (
                        <div className="rounded-lg animate-fade-slide-in">
                            <h2 className="text-lg font-semibold mb-4 text-hitech-text-secondary text-center">Ecco alcuni suggerimenti per iniziare:</h2>
                            <div className="flex overflow-x-auto space-x-3 pb-3 -mx-4 px-4 suggestions-scrollbar">
                                {exampleQuestions.slice(0, 5).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onSendMessage(q)}
                                        className="text-sm text-hitech-text-primary bg-hitech-surface hover:bg-hitech-surface-hover transition-colors px-4 py-2 rounded-full flex-shrink-0 whitespace-nowrap"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {history.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-slide-in`}>
                            <div className={`max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl ${
                                message.role === 'user' 
                                ? 'bg-hitech-accent text-hitech-dark' 
                                : 'bg-hitech-surface text-hitech-text-primary border border-hitech-border'
                            }`}>
                                <div dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)} />
                            </div>
                        </div>
                    ))}
                    {isQueryLoading && (
                        <div className="flex justify-start animate-fade-slide-in">
                            <div className="max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl bg-hitech-surface border border-hitech-border flex items-center">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-hitech-dark/80 backdrop-blur-sm">
                 <div className="max-w-4xl mx-auto">
                     <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Fai una domanda sui manuali..."
                            className="flex-grow bg-hitech-surface border border-hitech-border rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-hitech-accent text-hitech-text-primary"
                            disabled={isQueryLoading}
                        />
                        <button type="submit" disabled={isQueryLoading || !query.trim()} className="p-3 bg-hitech-accent hover:bg-hitech-accent-hover rounded-full text-hitech-dark disabled:bg-hitech-border transition-colors" title="Invia messaggio">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>

            {modalContent !== null && (
                <div 
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" 
                    onClick={closeModal} 
                    role="dialog" 
                    aria-modal="true"
                    aria-labelledby="source-modal-title"
                >
                    <div className="bg-hitech-surface p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 id="source-modal-title" className="text-xl font-bold mb-4">Testo della Fonte</h3>
                        <div 
                            className="flex-grow overflow-y-auto pr-4 text-hitech-text-secondary border-t border-b border-hitech-border py-4"
                            dangerouslySetInnerHTML={renderMarkdown(modalContent || '')}
                        >
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={closeModal} className="px-6 py-2 rounded-md bg-hitech-accent hover:bg-hitech-accent-hover text-hitech-dark font-semibold transition-colors" title="Chiudi la vista della fonte">
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;