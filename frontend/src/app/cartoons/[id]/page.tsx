import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function CartoonDetailPage() {
    return (
        <CourseDetailPage
            domain="cartoons"
            explorePath="/explore/cartoons"
            eyebrow="کارتون و انیمیشن"
            countKeys={["episodes_count"]}
            countLabel="بخش"
            accentClass="bg-purple-600"
        />
    );
}
