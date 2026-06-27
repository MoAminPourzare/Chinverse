# First real video test

This directory intentionally stays outside `frontend/public` during the first integration test.

- `6799269.mp4`: local source video
- `7524117.srt`: Chinese transcript generated from speech recognition
- `7524117.fa.srt`: Persian translation with matching cue IDs and timestamps

The Next.js test endpoints stream the MP4 with byte-range support and merge both SRT files into the transcript consumed by the existing lesson player.

Before publishing this lesson, a Chinese teacher should review the Chinese SRT. The speech-recognition output contains several likely homophone errors in the classical text; the Persian file translates the intended lesson where those errors were clear.

For production, replace the local video endpoint with the lesson's signed Arvan VOD HLS URL. Keep subtitles as structured lesson data in the application database so they remain editable, searchable, and connected to dictionary words.
