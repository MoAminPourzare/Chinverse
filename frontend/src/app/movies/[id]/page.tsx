import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function MovieDetailPage() {
    return (
        <CourseDetailPage
            domain="movies"
            explorePath="/explore/movies"
            eyebrow="فیلم"
            countKeys={["episodes_count"]}
            countLabel="بخش"
            accentClass="bg-red-600"
        />
    );
}
