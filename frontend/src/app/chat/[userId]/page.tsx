import { redirect } from "next/navigation";

export default function RetiredConversationPage() {
    redirect("/?tab=forum");
}
