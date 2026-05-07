import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function FestivalsCustomsExplorePage() {
    return (
        <CourseExplorePage
            title="آیین‌ها و جشن‌ها"
            subcategorySlug="festivals-customs"
            detailPath="/festivals-customs"
            layout="list"
            countLabel="درس"
            accentClass="bg-fuchsia-600"
        />
    );
}
