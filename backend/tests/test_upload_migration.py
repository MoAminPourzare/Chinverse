from scripts.migrate_uploads_to_object_storage import source_path_for_url


SOURCE_BASE_URL = "https://api.example.test"


def test_upload_migration_accepts_only_known_source_paths():
    assert (
        source_path_for_url("/uploads/avatars/avatar.png", SOURCE_BASE_URL)
        == "uploads/avatars/avatar.png"
    )
    assert (
        source_path_for_url(
            "https://api.example.test/static/uploads/gallery/photo.jpg",
            SOURCE_BASE_URL,
        )
        == "uploads/gallery/photo.jpg"
    )

    assert (
        source_path_for_url(
            "https://cdn.example.test/uploads/avatars/avatar.png",
            SOURCE_BASE_URL,
        )
        is None
    )
    assert source_path_for_url("/images/course-cover.jpg", SOURCE_BASE_URL) is None
    assert source_path_for_url("/uploads/avatars/../secret", SOURCE_BASE_URL) is None
