import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { VLOGS_CATALOG } from "@/lib/vlogsCatalog";

export default function VlogsDetailPage() {
    return <PlannedCourseDetailPage domain="vlogs" title="یادگیری با ولاگ" basePath="/vlogs" catalog={VLOGS_CATALOG} />;
}
