import ScreenMediaExplorePage from "@/components/course/ScreenMediaExplorePage";
import { MOVIE_CATALOG } from "@/lib/movieCatalog";

export default function MovieExplorePage() {
    return <ScreenMediaExplorePage title="فیلم" basePath="/movies" itemNoun="فیلم" catalog={MOVIE_CATALOG} />;
}
