import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { TEA_CULTURE_CATALOG } from "@/lib/teaCultureCatalog";

export default function TeaCultureDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="tea-culture"
            title="فرهنگ چای"
            basePath="/tea-culture"
            catalog={TEA_CULTURE_CATALOG}
            countLabel="درس"
            unitPlural="درس‌های"
            descriptionHeading="معرفی دوره:"
            listHeading="درس‌های دوره"
            eyebrow="هنر و مهارت‌های چینی"
        />
    );
}
