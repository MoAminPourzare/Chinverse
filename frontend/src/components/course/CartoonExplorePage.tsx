import ScreenMediaExplorePage from "@/components/course/ScreenMediaExplorePage";
import { CARTOON_CATALOG } from "@/lib/cartoonCatalog";

export default function CartoonExplorePage() {
    return (
        <ScreenMediaExplorePage
            title="انیمیشن و کارتون"
            basePath="/cartoons"
            itemNoun="انیمیشن"
            catalog={CARTOON_CATALOG}
            showEpisodeCount
        />
    );
}
