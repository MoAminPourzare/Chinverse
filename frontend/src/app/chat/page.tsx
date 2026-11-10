import { redirect } from "next/navigation";

export default function RetiredMessagesPage() {
    redirect("/?tab=forum");
}
