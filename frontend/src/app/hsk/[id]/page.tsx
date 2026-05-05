import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function HSKDetailPage() {
    return (
        <CourseDetailPage
            domain="hsk"
            explorePath="/explore/hsk"
            eyebrow="HSK"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-blue-600"
        />
    );
}
