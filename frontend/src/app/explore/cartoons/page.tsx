import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function CartoonsExplorePage() {
    return (
        <CourseExplorePage
            title="کارتون و انیمیشن"
            subcategorySlug="cartoons"
            detailPath="/cartoons"
            layout="portrait"
            countKeys={["episodes_count"]}
            countLabel="بخش"
        />
    );
}
