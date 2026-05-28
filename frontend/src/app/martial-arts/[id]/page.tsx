import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function MartialArtsDetailPage() {
    return (
        <CourseDetailPage
            domain="martial-arts"
            explorePath="/explore/martial-arts"
            eyebrow="هنرهای رزمی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-[#155aa6]"
        />
    );
}
