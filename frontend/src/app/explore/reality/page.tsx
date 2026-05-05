import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function RealityExplorePage() {
    return (
        <CourseExplorePage
            title="ریالیتی شو"
            subcategorySlug="reality"
            detailPath="/reality"
            layout="portrait"
            countKeys={["episodes_count"]}
            countLabel="قسمت"
        />
    );
}
