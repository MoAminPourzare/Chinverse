import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function FestivalsCustomsDetailPage() {
    return (
        <CourseDetailPage
            domain="festivals-customs"
            explorePath="/explore/festivals-customs"
            eyebrow="آیین‌ها و جشن‌ها"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-fuchsia-600"
        />
    );
}
