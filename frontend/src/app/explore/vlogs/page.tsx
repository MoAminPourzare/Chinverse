import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function VlogsExplorePage() {
    return (
        <CourseExplorePage
            title="یادگیری با ولاگ"
            subcategorySlug="vlogs"
            detailPath="/vlogs"
            layout="list"
            countLabel="درس"
            accentClass="bg-amber-600"
        />
    );
}
