import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function CharactersDetailPage() {
    return (
        <CourseDetailPage
            domain="characters"
            explorePath="/explore/characters"
            eyebrow="کاراکتر"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-purple-600"
        />
    );
}
