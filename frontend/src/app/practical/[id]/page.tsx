import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function PracticalDetailPage() {
    return (
        <CourseDetailPage
            domain="practical"
            explorePath="/explore/practical"
            eyebrow="چینی کاربردی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-cyan-600"
        />
    );
}
