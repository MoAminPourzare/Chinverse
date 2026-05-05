import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function MoviesExplorePage() {
    return (
        <CourseExplorePage
            title="فیلم"
            subcategorySlug="movies"
            detailPath="/movies"
            layout="portrait"
            countKeys={["episodes_count"]}
            countLabel="بخش"
        />
    );
}
