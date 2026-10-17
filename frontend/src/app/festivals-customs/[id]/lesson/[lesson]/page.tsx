import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { FESTIVALS_CUSTOMS_CATALOG } from "@/lib/festivalsCustomsCatalog";

export default function FestivalsCustomsLessonPage() {
    return (
        <PlannedLessonPage
            domain="festivals-customs"
            title="آیین‌ها و جشن‌ها"
            basePath="/festivals-customs"
            catalog={FESTIVALS_CUSTOMS_CATALOG}
            unitLabel="قسمت"
            unitPlural="قسمت‌ها"
            requirePublishedMedia
        />
    );
}
