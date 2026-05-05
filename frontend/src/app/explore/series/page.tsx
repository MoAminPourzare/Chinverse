import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function SeriesPage() {
    return (
        <CourseExplorePage
            title="سریال‌ها"
            subcategorySlug="series"
            detailPath="/series"
            layout="portrait"
            countKeys={["episodes_count"]}
            countLabel="قسمت"
        />
    );
}
