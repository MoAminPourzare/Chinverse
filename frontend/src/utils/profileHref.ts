export function getProfileHref(
    profileUserId?: number | string | null,
    currentUserId?: number | string | null,
) {
    if (!profileUserId) return "#";
    return String(profileUserId) === String(currentUserId) ? "/profile" : `/users/${profileUserId}`;
}
