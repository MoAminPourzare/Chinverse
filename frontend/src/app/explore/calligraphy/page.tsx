import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function CalligraphyExplorePage() {
    return (
        <CourseExplorePage
            title="خطاطی"
            subcategorySlug="calligraphy"
            detailPath="/calligraphy"
            layout="list"
            countLabel="درس"
            accentClass="bg-indigo-600"
        />
    );
}
