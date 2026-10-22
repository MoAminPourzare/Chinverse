import ScreenMediaLessonPage from "@/components/course/ScreenMediaLessonPage";
import { CARTOON_CATALOG } from "@/lib/cartoonCatalog";

export default function LessonPage() {
    return <ScreenMediaLessonPage domain="cartoons" catalog={CARTOON_CATALOG} />;
}
