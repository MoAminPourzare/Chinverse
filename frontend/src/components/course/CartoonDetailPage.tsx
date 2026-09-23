import ScreenMediaDetailPage from "@/components/course/ScreenMediaDetailPage";
import { CARTOON_CATALOG } from "@/lib/cartoonCatalog";

export default function CartoonDetailPage() {
    return (
        <ScreenMediaDetailPage
            domain="cartoons"
            title="انیمیشن و کارتون"
            itemNoun="انیمیشن"
            catalog={CARTOON_CATALOG}
            showEpisodes
        />
    );
}
