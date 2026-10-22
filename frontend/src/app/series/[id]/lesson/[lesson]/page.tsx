import ScreenMediaLessonPage from "@/components/course/ScreenMediaLessonPage";
import { SERIES_CATALOG } from "@/lib/seriesCatalog";

export default function LessonPage() {
    return <ScreenMediaLessonPage domain="series" catalog={SERIES_CATALOG} />;
}
