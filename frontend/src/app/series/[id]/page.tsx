import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function SeriesDetailPage() {
    return (
        <CourseDetailPage
            domain="series"
            explorePath="/explore/series"
            eyebrow="سریال"
            countKeys={["episodes_count"]}
            countLabel="قسمت"
            accentClass="bg-[#155aa6]"
        />
    );
}
