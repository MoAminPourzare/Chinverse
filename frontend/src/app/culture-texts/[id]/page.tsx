import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function CultureTextsDetailPage() {
    return (
        <CourseDetailPage
            domain="culture-texts"
            explorePath="/explore/culture-texts"
            eyebrow="متون کلاسیک آموزشی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-slate-700"
        />
    );
}
