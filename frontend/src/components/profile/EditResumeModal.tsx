"use client";

import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Award, Briefcase, FileText, GraduationCap, Languages, Plus, Trash2, Wrench, X } from "lucide-react";
import { SubmitHandler, useFieldArray, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { ResumeData, User, userService } from "@/services/user.service";
import { EDUCATION_DEGREE_OPTIONS, PROFILE_HEADLINE_OPTIONS, UNIVERSITY_OPTIONS } from "@/profileOptions";

interface EditResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdate: () => void;
    initialSection?: string | null;
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10";
const yearSelectClass = `${inputClass} cursor-pointer appearance-none bg-[linear-gradient(45deg,transparent_50%,#155aa6_50%),linear-gradient(135deg,#155aa6_50%,transparent_50%)] bg-[length:6px_6px,6px_6px] bg-[position:left_14px_center,left_8px_center] bg-no-repeat pl-8`;
const yearOptions = buildYearOptions();
const sectionTitles: Record<string, string> = {
    work: "سوابق کاری",
    education: "تحصیلات",
    certificates: "گواهینامه‌ها",
    awards: "جوایز و تقدیرنامه‌ها",
    skills: "مهارت‌ها",
    languages: "زبان‌ها",
};

export default function EditResumeModal({ isOpen, onClose, user, onUpdate, initialSection }: EditResumeModalProps) {
    const [resumeDateError, setResumeDateError] = useState("");
    const { register, control, handleSubmit, reset } = useForm<ResumeData>({
        defaultValues: {
            work_experiences: [],
            educations: [],
            certificates: [],
            awards: [],
            skills: [],
            languages: [],
        },
    });

    const work = useFieldArray({ control, name: "work_experiences" });
    const education = useFieldArray({ control, name: "educations" });
    const certificate = useFieldArray({ control, name: "certificates" });
    const award = useFieldArray({ control, name: "awards" });
    const skill = useFieldArray({ control, name: "skills" });
    const language = useFieldArray({ control, name: "languages" });

    const resetToUser = useCallback(() => {
        if (user?.profile?.resume) {
            reset(user.profile.resume as ResumeData);
        } else {
            reset({
                work_experiences: [],
                educations: [],
                certificates: [],
                awards: [],
                skills: [],
                languages: [],
            });
        }
    }, [reset, user]);

    useEffect(() => {
        if (isOpen) {
            resetToUser();
        }
    }, [isOpen, resetToUser]);

    const handleClose = () => {
        setResumeDateError("");
        resetToUser();
        onClose();
    };

    const onSubmit: SubmitHandler<ResumeData> = async (data) => {
        const dateError = validateResumeDateRanges(data);
        if (dateError) {
            setResumeDateError(dateError);
            return;
        }

        try {
            setResumeDateError("");
            await userService.updateProfile({ resume: data });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to update resume", error);
        }
    };

    const shouldShowSection = (section: string) => !initialSection || initialSection === section;
    const dialogTitle = initialSection ? sectionTitles[initialSection] || "ویرایش رزومه" : "رزومه ساز";

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose} dir="rtl">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="flex h-[min(720px,92vh)] w-full max-w-md transform flex-col overflow-hidden rounded-[30px] bg-[#f9fafc] text-right align-middle shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all">
                                <div className="flex shrink-0 items-center justify-between px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                                        aria-label="بستن"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    <Dialog.Title as="h3" className="text-[18px] font-black text-[#25272d]">
                                        {dialogTitle}
                                    </Dialog.Title>
                                    <span className="h-9 w-9" />
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
                                    <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 pb-4 pt-1">
                                        {resumeDateError && (
                                            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                                                {resumeDateError}
                                            </div>
                                        )}
                                        {shouldShowSection("work") && (
                                        <ResumeSection
                                            title="سوابق کاری"
                                            icon={<Briefcase className="h-5 w-5" />}
                                            addLabel="سوابق کاری رو اضافه کن"
                                            onAdd={() => work.append({ company: "", job_title: "", start_date: "", end_date: "" })}
                                        >
                                            {work.fields.map((field, index) => (
                                                <ResumeCard key={field.id} onRemove={() => work.remove(index)}>
                                                    <input {...register(`work_experiences.${index}.company`)} placeholder="نام شرکت" dir="auto" className={inputClass} />
                                                    <OptionSelect registration={register(`work_experiences.${index}.job_title`)} placeholder="عنوان شغلی" options={PROFILE_HEADLINE_OPTIONS} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <YearSelect registration={register(`work_experiences.${index}.start_date`)} placeholder="سال شروع" />
                                                        <YearSelect registration={register(`work_experiences.${index}.end_date`)} placeholder="سال پایان" />
                                                    </div>
                                                </ResumeCard>
                                            ))}
                                        </ResumeSection>
                                        )}

                                        {shouldShowSection("education") && (
                                        <ResumeSection
                                            title="تحصیلات"
                                            icon={<GraduationCap className="h-5 w-5" />}
                                            addLabel="سوابق تحصیلیتو اضافه کن"
                                            onAdd={() => education.append({ university: "", degree: "", field: "", start_date: "", end_date: "" })}
                                        >
                                            {education.fields.map((field, index) => (
                                                <ResumeCard key={field.id} onRemove={() => education.remove(index)}>
                                                    <OptionSelect registration={register(`educations.${index}.university`)} placeholder="دانشگاه محل تحصیل" options={UNIVERSITY_OPTIONS} />
                                                    <OptionSelect registration={register(`educations.${index}.degree`)} placeholder="مقطع تحصیلی" options={EDUCATION_DEGREE_OPTIONS} />
                                                    <input {...register(`educations.${index}.field`)} placeholder="رشته تحصیلی" dir="auto" className={inputClass} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <YearSelect registration={register(`educations.${index}.start_date`)} placeholder="سال شروع" />
                                                        <YearSelect registration={register(`educations.${index}.end_date`)} placeholder="سال پایان" />
                                                    </div>
                                                </ResumeCard>
                                            ))}
                                        </ResumeSection>
                                        )}

                                        {shouldShowSection("certificates") && (
                                        <ResumeSection
                                            title="گواهینامه‌ها"
                                            icon={<FileText className="h-5 w-5" />}
                                            addLabel="گواهینامه‌هاتو اضافه کن"
                                            onAdd={() => certificate.append({ title: "", issuer: "", date: "" })}
                                        >
                                            {certificate.fields.map((field, index) => (
                                                <ResumeCard key={field.id} onRemove={() => certificate.remove(index)}>
                                                    <input {...register(`certificates.${index}.title`)} placeholder="عنوان گواهی" dir="auto" className={inputClass} />
                                                    <input {...register(`certificates.${index}.issuer`)} placeholder="صادر کننده" dir="auto" className={inputClass} />
                                                    <YearSelect registration={register(`certificates.${index}.date`)} placeholder="سال صدور" />
                                                </ResumeCard>
                                            ))}
                                        </ResumeSection>
                                        )}

                                        {shouldShowSection("awards") && (
                                        <ResumeSection
                                            title="جوایز و تقدیرنامه‌ها"
                                            icon={<Award className="h-5 w-5" />}
                                            addLabel="جوایز و تقدیرنامه‌هاتو اضافه کن"
                                            onAdd={() => award.append({ title: "", issuer: "", date: "" })}
                                        >
                                            {award.fields.map((field, index) => (
                                                <ResumeCard key={field.id} onRemove={() => award.remove(index)}>
                                                    <input {...register(`awards.${index}.title`)} placeholder="عنوان جایزه" dir="auto" className={inputClass} />
                                                    <input {...register(`awards.${index}.issuer`)} placeholder="اهدا کننده" dir="auto" className={inputClass} />
                                                    <YearSelect registration={register(`awards.${index}.date`)} placeholder="سال دریافت" />
                                                </ResumeCard>
                                            ))}
                                        </ResumeSection>
                                        )}

                                        {shouldShowSection("skills") && (
                                        <ResumeSection
                                            title="مهارت‌ها"
                                            icon={<Wrench className="h-5 w-5" />}
                                            addLabel="مهارت‌هاتو اضافه کن"
                                            onAdd={() => skill.append({ name: "", level: "" })}
                                        >
                                            {skill.fields.map((field, index) => (
                                                <ResumeCard key={field.id} onRemove={() => skill.remove(index)}>
                                                    <input {...register(`skills.${index}.name`)} placeholder="نام مهارت" dir="auto" className={inputClass} />
                                                    <input {...register(`skills.${index}.level`)} placeholder="سطح، مثلا پیشرفته" dir="auto" className={inputClass} />
                                                </ResumeCard>
                                            ))}
                                        </ResumeSection>
                                        )}

                                        {shouldShowSection("languages") && (
                                        <ResumeSection
                                            title="زبان‌ها"
                                            icon={<Languages className="h-5 w-5" />}
                                            addLabel="زبان‌هاتو اضافه کن"
                                            onAdd={() => language.append({ name: "", level: "" })}
                                        >
                                            {language.fields.map((field, index) => (
                                                <ResumeCard key={field.id} onRemove={() => language.remove(index)}>
                                                    <input {...register(`languages.${index}.name`)} placeholder="نام زبان" dir="auto" className={inputClass} />
                                                    <input {...register(`languages.${index}.level`)} placeholder="سطح، مثلا متوسط" dir="auto" className={inputClass} />
                                                </ResumeCard>
                                            ))}
                                        </ResumeSection>
                                        )}
                                    </div>

                                    <div className="grid shrink-0 grid-cols-2 gap-4 px-6 py-5">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="rounded-full bg-[#e7eaf0] py-3 text-sm font-bold text-slate-500 shadow-[0_5px_10px_rgba(15,23,42,0.16)] transition hover:bg-slate-200"
                                        >
                                            لغو کردن
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-full bg-[#155aa6] py-3 text-sm font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.32)] transition hover:bg-[#0f4e92]"
                                        >
                                            ذخیره کردن
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function YearSelect({ registration, placeholder }: { registration: UseFormRegisterReturn; placeholder: string }) {
    return (
        <select {...registration} className={yearSelectClass}>
            <option value="">{placeholder}</option>
            {yearOptions.map((year) => (
                <option key={year} value={year}>
                    {year}
                </option>
            ))}
        </select>
    );
}

function OptionSelect({ registration, placeholder, options }: { registration: UseFormRegisterReturn; placeholder: string; options: string[] }) {
    return (
        <select {...registration} className={yearSelectClass}>
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

function buildYearOptions() {
    const currentYear = Number(
        new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" })
            .format(new Date())
            .replace(/[^۰-۹0-9]/g, "")
            .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))),
    ) || 1405;

    return Array.from({ length: currentYear - 1350 + 1 }, (_, index) => String(currentYear - index));
}

function validateResumeDateRanges(data: ResumeData) {
    const invalidWork = data.work_experiences?.some((item) => isEndBeforeStart(item.start_date, item.end_date));
    if (invalidWork) {
        return "در سوابق کاری، سال پایان نمی‌تواند کمتر از سال شروع باشد.";
    }

    const invalidEducation = data.educations?.some((item) => isEndBeforeStart(item.start_date, item.end_date));
    if (invalidEducation) {
        return "در تحصیلات، سال پایان نمی‌تواند کمتر از سال شروع باشد.";
    }

    return "";
}

function isEndBeforeStart(start?: string, end?: string) {
    if (!start || !end) return false;
    const startYear = Number(start);
    const endYear = Number(end);
    if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return false;
    return endYear < startYear;
}

function ResumeSection({
    title,
    icon,
    addLabel,
    onAdd,
    children,
}: {
    title: string;
    icon: ReactNode;
    addLabel: string;
    onAdd: () => void;
    children: ReactNode;
}) {
    return (
        <section>
            <h4 className="mb-3 flex items-center justify-end gap-2 text-[16px] font-black text-[#2f3238]">
                {title}
                <span className="text-[#155aa6]">{icon}</span>
            </h4>
            <button
                type="button"
                onClick={onAdd}
                className="ml-auto flex items-center gap-2 rounded-lg border border-[#b9cbe0] bg-[#e9edf3] px-4 py-3 text-right text-[13px] font-bold text-[#155aa6] transition hover:bg-[#eef6ff]"
            >
                <Plus className="h-5 w-5" />
                {addLabel}
            </button>
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}

function ResumeCard({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
    return (
        <div className="relative space-y-2 rounded-2xl border border-[#d6e1ee] bg-white p-3 shadow-sm">
            <button
                type="button"
                onClick={onRemove}
                className="absolute left-2 top-2 rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                aria-label="حذف مورد"
            >
                <Trash2 className="h-4 w-4" />
            </button>
            <div className="space-y-2 pt-8">{children}</div>
        </div>
    );
}
