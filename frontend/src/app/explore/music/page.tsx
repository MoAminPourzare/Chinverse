import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function MusicExplorePage() {
    return (
        <CourseExplorePage
            title="موسیقی"
            subcategorySlug="music"
            detailPath="/music"
            layout="square"
            countKeys={["tracks_count"]}
            countLabel="آهنگ"
        />
    );
}
