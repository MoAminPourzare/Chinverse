import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function IdiomsDetailPage() {
    return (
        <CourseDetailPage
            domain="idioms"
            explorePath="/explore/idioms"
            eyebrow="اصطلاحات"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-rose-600"
        />
    );
}
