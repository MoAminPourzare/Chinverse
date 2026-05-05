import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function GrammarDetailPage() {
    return (
        <CourseDetailPage
            domain="grammar"
            explorePath="/explore/grammar"
            eyebrow="گرامر"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-emerald-600"
        />
    );
}
