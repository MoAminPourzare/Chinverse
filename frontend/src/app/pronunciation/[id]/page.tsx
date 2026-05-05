import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function PronunciationDetailPage() {
    return (
        <CourseDetailPage
            domain="pronunciation"
            explorePath="/explore/pronunciation"
            eyebrow="تلفظ"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-blue-600"
        />
    );
}
