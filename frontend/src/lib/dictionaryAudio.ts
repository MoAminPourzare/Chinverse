import api from '@/lib/api';

export type AudioState = 'pending' | 'ready' | 'approved' | 'rejected';
export interface DictionaryRecording {
    id: number;
    word_id: number;
    chinese: string;
    pinyin: string;
    level: string;
    meaning: string | null;
    audio_url: string;
    sha256: string;
    pinyins: string[];
    review_reasons: string[];
    status: AudioState;
    approved_pinyin: string | null;
    active: boolean;
    stale: boolean;
    curated_audio_preserved: boolean;
}
export interface AudioPage {
    items: DictionaryRecording[];
    total: number;
    counts: Partial<Record<AudioState, number>>;
    expected: number;
    imported: number;
}
export const dictionaryAudioService = {
    async list(params: { q: string; state: AudioState | 'all'; level: string; multiple: boolean; skip: number }, signal?: AbortSignal) {
        return (await api.get<AudioPage>('/admin/dictionary-audio', {
            params: { ...params, limit: 20 }, signal, chinverseCacheTtlMs: 0,
        })).data;
    },
    async review(clip: DictionaryRecording, decision: 'approved' | 'rejected', approved_pinyin?: string) {
        return (await api.post<DictionaryRecording>(`/admin/dictionary-audio/${clip.id}/review`, {
            sha256: clip.sha256, decision, approved_pinyin,
        })).data;
    },
};
