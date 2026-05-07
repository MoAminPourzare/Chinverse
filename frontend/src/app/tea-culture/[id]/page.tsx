import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function TeaCultureDetailPage() {
    return (
        <CourseDetailPage
            domain="tea-culture"
            explorePath="/explore/tea-culture"
            eyebrow="فرهنگ چای"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-amber-700"
        />
    );
}
