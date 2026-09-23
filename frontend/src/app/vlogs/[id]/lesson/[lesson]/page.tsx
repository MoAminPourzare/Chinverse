import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { VLOGS_CATALOG } from "@/lib/vlogsCatalog";

export default function VlogsLessonPage() {
    return <PlannedLessonPage domain="vlogs" title="یادگیری با ولاگ" basePath="/vlogs" catalog={VLOGS_CATALOG} />;
}
