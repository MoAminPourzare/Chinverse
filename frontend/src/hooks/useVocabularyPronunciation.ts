"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaUrl } from "@/lib/media";

/** Prefer the dictionary recording; use a Mandarin device voice if it is absent or fails. */
export function useVocabularyPronunciation(word: { id: number; chinese: string; audio_url?: string | null }, isOpen: boolean) {
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deviceVoice, setDeviceVoice] = useState(false);
    const audio = useRef<HTMLAudioElement | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    const request = useRef(0);

    const stop = useCallback(() => {
        request.current += 1;
        audio.current?.pause();
        audio.current = null;
        if (utterance.current) window.speechSynthesis?.cancel();
        utterance.current = null;
        setPlaying(false);
    }, []);

    useEffect(() => {
        setError(null);
        setDeviceVoice(false);
        if (isOpen) window.speechSynthesis?.getVoices();
        return stop;
    }, [isOpen, word.id, stop]);

    const play = useCallback(async () => {
        stop();
        const id = request.current;
        setError(null);
        setDeviceVoice(false);
        setPlaying(true);
        let usedFallback = false;
        const fallback = async () => {
            if (id !== request.current || usedFallback) return;
            usedFallback = true;
            audio.current?.pause();
            const synthesis = window.speechSynthesis;
            if (!synthesis || typeof SpeechSynthesisUtterance === "undefined") {
                setPlaying(false);
                setError("تلفظ این واژه روی دستگاهت در دسترس نیست. دوباره تلاش کن.");
                return;
            }
            // Prime voices when the modal opens; wait once if the browser loads them lazily.
            if (synthesis.getVoices().length === 0) {
                await new Promise<void>((resolve) => {
                    const finish = () => { window.clearTimeout(timer); synthesis.removeEventListener("voiceschanged", finish); resolve(); };
                    const timer = window.setTimeout(finish, 1500);
                    synthesis.addEventListener("voiceschanged", finish, { once: true });
                });
            }
            if (id !== request.current) return;
            const voices = synthesis.getVoices();
            const voice = voices.find((item) => /^zh[-_](CN|SG)$/i.test(item.lang))
                || voices.find((item) => /^(cmn(?:[-_].*)?|zh(?:[-_]TW)?)$/i.test(item.lang));
            if (!voice) {
                setPlaying(false);
                setError("صدای چینی روی دستگاهت فعال نیست. صدای چینی را در تنظیمات گفتار دستگاه اضافه کن و دوباره بزن.");
                return;
            }
            const speech = new SpeechSynthesisUtterance(word.chinese);
            speech.lang = voice.lang;
            speech.voice = voice;
            speech.rate = 0.85;
            speech.onend = () => { if (id === request.current) { utterance.current = null; setPlaying(false); } };
            speech.onerror = () => {
                if (id === request.current) { utterance.current = null; setPlaying(false); setError("پخش تلفظ انجام نشد. دوباره روی بلندگو بزن."); }
            };
            utterance.current = speech;
            setDeviceVoice(true);
            synthesis.speak(speech);
        };
        if (!word.audio_url) { await fallback(); return; }
        const player = new Audio(getMediaUrl(word.audio_url));
        audio.current = player;
        player.onended = () => { if (id === request.current) setPlaying(false); };
        player.onerror = () => { void fallback(); };
        const timer = window.setTimeout(() => { void fallback(); }, 8000);
        try { await player.play(); }
        catch { await fallback(); }
        finally { window.clearTimeout(timer); }
    }, [stop, word.audio_url, word.chinese]);

    return { play, stop, playing, error, deviceVoice };
}
