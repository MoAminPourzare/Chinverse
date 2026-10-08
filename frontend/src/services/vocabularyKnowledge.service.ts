import api from "@/lib/api";

export type VocabularyState = "new" | "leitner" | "known";
export type VocabularyStates = Record<string, VocabularyState>;

async function requestStates(path: string, words: string[], signal?: AbortSignal): Promise<VocabularyStates> {
    const unique = [...new Set(words.filter(Boolean))];
    const states: VocabularyStates = {};
    // Keep every word when a long lesson exceeds one request's limit.
    for (let offset = 0; offset < unique.length; offset += 5000) {
        const response = await api.post<{ states: VocabularyStates }>(path, { words: unique.slice(offset, offset + 5000) }, { signal });
        Object.assign(states, response.data.states);
    }
    return states;
}

export const vocabularyKnowledgeService = {
    get: (words: string[], signal?: AbortSignal) => requestStates("/vocabulary/knowledge", words, signal),
    markKnown: (words: string[]) => requestStates("/vocabulary/known", words),
};
