import ScreenMediaLessonPage from "@/components/course/ScreenMediaLessonPage";
import { MOVIE_CATALOG } from "@/lib/movieCatalog";

export default function LessonPage() {
    return <ScreenMediaLessonPage domain="movies" catalog={MOVIE_CATALOG} />;
}
