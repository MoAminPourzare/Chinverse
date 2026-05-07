import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function CalligraphyDetailPage() {
    return (
        <CourseDetailPage
            domain="calligraphy"
            explorePath="/explore/calligraphy"
            eyebrow="خطاطی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-indigo-600"
        />
    );
}
