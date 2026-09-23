import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { FESTIVALS_CUSTOMS_CATALOG } from "@/lib/festivalsCustomsCatalog";

export default function FestivalsCustomsExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="آیین‌ها و جشن‌ها"
            basePath="/festivals-customs"
            catalog={FESTIVALS_CUSTOMS_CATALOG}
            countLabel="درس"
        />
    );
}
