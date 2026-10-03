import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { VLOGS_CATALOG } from "@/lib/vlogsCatalog";

export default function VlogsExplorePage() {
    return <PlannedCourseExplorePage title="یادگیری با ولاگ" basePath="/vlogs" catalog={VLOGS_CATALOG} />;
}
