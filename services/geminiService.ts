/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { RagStore, Document, QueryResult, CustomMetadata } from '../types';

let ai: GoogleGenAI;

export function initialize(apiKey?: string) {
    const keyToUse = apiKey || process.env.API_KEY;
    if (!keyToUse) {
        throw new Error("La Chiave API non è configurata. Forniscine una o imposta la variabile d'ambiente API_KEY.");
    }
    ai = new GoogleGenAI({ apiKey: keyToUse });
}

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createRagStore(displayName: string): Promise<string> {
    if (!ai) throw new Error("Gemini AI non inizializzato");
    const ragStore = await ai.fileSearchStores.create({ config: { displayName } });
    if (!ragStore.name) {
        throw new Error("Impossibile creare l'archivio RAG: nome mancante.");
    }
    return ragStore.name;
}

export async function uploadToRagStore(ragStoreName: string, file: File): Promise<void> {
    if (!ai) throw new Error("Gemini AI non inizializzato");
    
    let op = await ai.fileSearchStores.uploadToFileSearchStore({
        fileSearchStoreName: ragStoreName,
        file: file
    });

    while (!op.done) {
        await delay(3000);
        op = await ai.operations.get({operation: op});
    }
}

export async function fileSearch(ragStoreName: string, query: string): Promise<QueryResult> {
    if (!ai) throw new Error("Gemini AI non inizializzato");
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query + " NON CHIEDERE ALL'UTENTE DI LEGGERE IL MANUALE, individua le sezioni pertinenti nella risposta stessa.",
        config: {
            tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [ragStoreName],
                        }
                    }
                ]
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
        text: response.text,
        groundingChunks: groundingChunks,
    };
}

export async function generateExampleQuestions(ragStoreName: string): Promise<string[]> {
    if (!ai) throw new Error("Gemini AI non inizializzato");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Ti vengono forniti alcuni manuali utente per alcuni prodotti. Scopri per quale prodotto è ogni manuale, basandoti sul contenuto della pagina di copertina. NON INDOVINARE O ALLUCINARE IL PRODOTTO. Quindi, per ogni prodotto, genera 4 brevi e pratiche domande di esempio che un utente potrebbe porre al riguardo in italiano. Restituisci le domande come un array JSON di oggetti. Ogni oggetto dovrebbe avere una chiave 'product' con il nome del prodotto come stringa, e una chiave 'questions' con un array di 4 stringhe di domande. Per esempio: ```json[{\"product\": \"Prodotto A\", \"questions\": [\"d1\", \"d2\"]}, {\"product\": \"Prodotto B\", \"questions\": [\"d3\", \"d4\"]}]```",
            config: {
                tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [ragStoreName],
                        }
                    }
                ]
            }
        });
        
        let jsonText = response.text.trim();

        const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonText = jsonMatch[1];
        } else {
            const firstBracket = jsonText.indexOf('[');
            const lastBracket = jsonText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                jsonText = jsonText.substring(firstBracket, lastBracket + 1);
            }
        }
        
        const parsedData = JSON.parse(jsonText);
        
        if (Array.isArray(parsedData)) {
            if (parsedData.length === 0) {
                return [];
            }
            const firstItem = parsedData[0];

            // Handle new format: array of {product, questions[]}
            if (typeof firstItem === 'object' && firstItem !== null && 'questions' in firstItem && Array.isArray(firstItem.questions)) {
                return parsedData.flatMap(item => (item.questions || [])).filter(q => typeof q === 'string');
            }
            
            // Handle old format: array of strings
            if (typeof firstItem === 'string') {
                return parsedData.filter(q => typeof q === 'string');
            }
        }
        
        console.warn("Ricevuto formato inatteso per le domande di esempio:", parsedData);
        return [];
    } catch (error) {
        console.error("Impossibile generare o analizzare le domande di esempio:", error);
        return [];
    }
}


export async function deleteRagStore(ragStoreName: string): Promise<void> {
    if (!ai) throw new Error("Gemini AI non inizializzato");
    // DO: Remove `(as any)` type assertion.
    await ai.fileSearchStores.delete({
        name: ragStoreName,
        config: { force: true },
    });
}