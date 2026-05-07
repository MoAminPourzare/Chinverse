import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function SynonymsDetailPage() {
    return (
        <CourseDetailPage
            domain="synonyms"
            explorePath="/explore/synonyms"
            eyebrow="واژگان هم معنی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-sky-600"
        />
    );
}
