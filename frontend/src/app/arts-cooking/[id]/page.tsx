import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function ArtsCookingDetailPage() {
    return (
        <CourseDetailPage
            domain="arts-cooking"
            explorePath="/explore/arts-cooking"
            eyebrow="آشپزی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-orange-600"
        />
    );
}
