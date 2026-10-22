-- Owner-authorized test content, 2026-09-28. Run manually ONLY on staging:
-- project twilight-unit-31615795 / branch br-shiny-darkness-at6obb2e,
-- endpoint ep-wild-band-atse2yoq / database neondb.
-- Verify the branch and endpoint in Neon before running. Never run on production.
-- The payload was checked with SubtitleTrackCreate and assess_subtitle_cues
-- against the existing 4-second synthetic video: valid, score 100, no warnings.
-- This is not a migration or an automatic deployment seed.
BEGIN;

DO $owner_fixture$
DECLARE
    next_track_id bigint;
    current_track_id bigint;
    current_revision integer;
    fixture_source constant text := 'owner-review-leitner-20260928.json';
    fixture_checksum constant text := '22654385abc2b6bcb6651a270658717da32487532bd5f3277a94a07ed474df77';
BEGIN
    PERFORM pg_advisory_xact_lock(206, 20260928);

    IF current_database() <> 'neondb' OR NOT EXISTS (
        SELECT 1
        FROM lessons l
        JOIN courses c ON c.id = l.course_id
        JOIN media_assets m ON m.id = l.media_id
        WHERE l.id = 206 AND c.id = 70 AND m.id = 4
          AND c.slug = 'owner-review-video-20260921'
          AND l.is_free AND l.status = 'published' AND c.status = 'published'
          AND m.status = 'published' AND m.license_status = 'approved'
          AND m.duration_seconds = 4
    ) THEN
        RAISE EXCEPTION 'Expected published, free, synthetic owner-review lesson is missing';
    END IF;

    IF (SELECT count(*) FROM dictionary_words
        WHERE (id = 147 AND chinese = '你好' OR id = 240 AND chinese = '谢谢')
          AND status = 'published') <> 2 THEN
        RAISE EXCEPTION 'Both published curated vocabulary words are required';
    END IF;

    IF EXISTS (
        SELECT 1 FROM subtitle_tracks
        WHERE lesson_id = 206 AND language = 'fa' AND source_name = fixture_source
          AND status = 'published' AND quality_status = 'valid'
          AND checksum_sha256 = fixture_checksum
          AND (SELECT count(*) FROM subtitle_cues WHERE track_id = subtitle_tracks.id) = 2
    ) THEN
        RAISE NOTICE 'Owner Leitner subtitle fixture is already published';
        RETURN;
    END IF;

    SELECT id, revision INTO current_track_id, current_revision
    FROM subtitle_tracks
    WHERE lesson_id = 206 AND language = 'fa'
    ORDER BY revision DESC, id DESC LIMIT 1 FOR UPDATE;

    IF current_track_id IS DISTINCT FROM 2 OR current_revision IS DISTINCT FROM 1
       OR NOT EXISTS (SELECT 1 FROM subtitle_tracks WHERE id = 2
                      AND status = 'published' AND source_name = 'owner-review-fa.srt') THEN
        RAISE EXCEPTION 'Existing subtitle changed; inspect it before replacing the fixture';
    END IF;

    INSERT INTO subtitle_tracks
        (lesson_id, language, format, revision, supersedes_id, status,
         quality_status, quality_score, quality_report, checksum_sha256, source_name)
    VALUES
        (206, 'fa', 'json', 2, 2, 'draft', 'valid', 100,
         '{"valid":true,"errors":[],"warnings":[],"quality_score":100}'::jsonb,
         fixture_checksum, fixture_source)
    RETURNING id INTO next_track_id;

    INSERT INTO subtitle_cues
        (track_id, cue_index, timestamp_start, timestamp_end,
         zh_text, pinyin, target_text, highlighted_words)
    VALUES
        (next_track_id, 0, 0.5, 2.0, '你好！', 'Nǐ hǎo!', 'سلام!', '["你好"]'::jsonb),
        (next_track_id, 1, 2.1, 3.8, '谢谢！', 'Xièxie!', 'متشکرم!', '["谢谢"]'::jsonb);

    -- Preserve the original track/cues so the change can be reversed.
    UPDATE subtitle_tracks SET status = 'archived', updated_at = now() WHERE id = 2;
    UPDATE subtitle_tracks
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE id = next_track_id;
END;
$owner_fixture$;

COMMIT;

SELECT t.id, t.lesson_id, t.revision, t.status, t.quality_status,
       t.quality_score, t.source_name, c.zh_text, c.pinyin, c.target_text
FROM subtitle_tracks t JOIN subtitle_cues c ON c.track_id = t.id
WHERE t.lesson_id = 206 AND t.source_name = 'owner-review-leitner-20260928.json'
ORDER BY t.revision, c.cue_index;

-- Rollback, only if needed later: in one transaction archive the track with
-- source_name='owner-review-leitner-20260928.json' and lesson_id=206 first,
-- then restore track 2 to published. Keep both tracks and their cues.
