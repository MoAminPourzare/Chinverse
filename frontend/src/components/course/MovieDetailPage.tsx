import ScreenMediaDetailPage from "@/components/course/ScreenMediaDetailPage";
import { MOVIE_CATALOG } from "@/lib/movieCatalog";

export default function MovieDetailPage() {
    return <ScreenMediaDetailPage domain="movies" title="فیلم‌ها" itemNoun="فیلم" catalog={MOVIE_CATALOG} />;
}
