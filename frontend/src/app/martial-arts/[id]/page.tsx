import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { MARTIAL_ARTS_CATALOG } from "@/lib/martialArtsCatalog";

export default function MartialArtsDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="martial-arts"
            title="هنرهای رزمی"
            basePath="/martial-arts"
            catalog={MARTIAL_ARTS_CATALOG}
            countLabel="قسمت"
            unitPlural="قسمت‌های"
            descriptionHeading="معرفی دوره:"
            listHeading="قسمت‌های دوره"
            eyebrow="هنر و مهارت‌های چینی"
        />
    );
}
