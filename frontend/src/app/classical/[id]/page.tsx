import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function ClassicalDetailPage() {
    return (
        <CourseDetailPage
            domain="classical"
            explorePath="/explore/classical"
            eyebrow="زبان چینی کلاسیک"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-slate-700"
        />
    );
}
