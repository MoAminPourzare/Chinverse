import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function MusicDetailPage() {
    return (
        <CourseDetailPage
            domain="music"
            explorePath="/explore/music"
            eyebrow="موسیقی"
            countKeys={["tracks_count", "episodes_count"]}
            countLabel="آهنگ"
            accentClass="bg-teal-600"
        />
    );
}
