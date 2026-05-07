import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function ClassicalPoetryDetailPage() {
    return (
        <CourseDetailPage
            domain="classical-poetry"
            explorePath="/explore/classical-poetry"
            eyebrow="شعر و ادبیات کلاسیک"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-violet-600"
        />
    );
}
