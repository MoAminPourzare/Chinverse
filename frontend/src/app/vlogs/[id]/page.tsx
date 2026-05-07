import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function VlogsDetailPage() {
    return (
        <CourseDetailPage
            domain="vlogs"
            explorePath="/explore/vlogs"
            eyebrow="یادگیری با ولاگ"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-amber-600"
        />
    );
}
