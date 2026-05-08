import Surface from "@/components/ui/Surface";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { ArrowRight, BookOpen, Flame, Play, Sparkles } from "lucide-react";

const highlights = [
    { title: "درس‌های ساختارمند", icon: BookOpen },
    { title: "پخش ویدیویی تمیز", icon: Play },
    { title: "تمرین روزانه", icon: Flame },
    { title: "مسیرهای فرهنگی", icon: Sparkles },
];

export default function LandingPage() {
    return (
        <div className="min-h-full px-4 py-6" dir="rtl">
            <main className="mx-auto grid min-h-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
                    <div className="p-6 sm:p-8">
                        <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/80">
                            ChinVerse
                        </div>
                        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
                            یادگیری چینی، مرتب‌تر و جذاب‌تر
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                            یک وب‌اپ حرفه‌ای برای یادگیری زبان چینی با مسیرهای آموزشی، ویدیوها، واژگان و محتوای فرهنگی.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <PrimaryButton href="/login" variant="light" leadingIcon={<ArrowRight size={16} />}>
                                ورود
                            </PrimaryButton>
                            <PrimaryButton href="/signup" variant="ghost" className="!border-white/15 !bg-white/10 !text-white hover:!bg-white/15">
                                ثبت نام
                            </PrimaryButton>
                        </div>
                    </div>
                </Surface>

                <div className="grid gap-3 sm:grid-cols-2">
                    {highlights.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Surface key={item.title} className="p-5">
                                <div className="inline-flex rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-3 text-white shadow-lg">
                                    <Icon size={18} />
                                </div>
                                <h2 className="mt-4 text-base font-bold text-slate-900">{item.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    یک تجربه‌ی تمیز و قابل‌اسکن برای یادگیری روزانه.
                                </p>
                            </Surface>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
