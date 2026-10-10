import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { MARTIAL_ARTS_CATALOG } from "@/lib/martialArtsCatalog";

export default function MartialArtsExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="هنرهای رزمی"
            basePath="/martial-arts"
            catalog={MARTIAL_ARTS_CATALOG}
            countLabel="قسمت"
        />
    );
}
