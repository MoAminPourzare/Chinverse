import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { CALLIGRAPHY_CATALOG } from "@/lib/calligraphyCatalog";

export default function CalligraphyDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="calligraphy"
            title="خطاطی"
            basePath="/calligraphy"
            catalog={CALLIGRAPHY_CATALOG}
            countLabel="درس"
            unitPlural="درس‌های"
            descriptionHeading="معرفی دوره:"
            listHeading="درس‌های دوره"
            eyebrow="هنر و مهارت‌های چینی"
        />
    );
}
