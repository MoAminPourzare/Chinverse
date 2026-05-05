import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function RealityDetailPage() {
    return (
        <CourseDetailPage
            domain="reality"
            explorePath="/explore/reality"
            eyebrow="ریالیتی شو"
            countKeys={["episodes_count"]}
            countLabel="قسمت"
            accentClass="bg-pink-600"
        />
    );
}
