import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { PRONUNCIATION_CATALOG } from "@/lib/pronunciationCatalog";

export default function PronunciationPage() {
    return <PlannedCourseExplorePage title="تلفظ" basePath="/pronunciation" catalog={PRONUNCIATION_CATALOG} />;
}
