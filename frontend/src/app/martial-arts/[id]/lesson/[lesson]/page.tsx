import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { MARTIAL_ARTS_CATALOG } from "@/lib/martialArtsCatalog";

export default function MartialArtsLessonPage() {
    return (
        <PlannedLessonPage
            domain="martial-arts"
            title="هنرهای رزمی"
            basePath="/martial-arts"
            catalog={MARTIAL_ARTS_CATALOG}
            unitLabel="قسمت"
            unitPlural="قسمت‌ها"
            requirePublishedMedia
        />
    );
}
