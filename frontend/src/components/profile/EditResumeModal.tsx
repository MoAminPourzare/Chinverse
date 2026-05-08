'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Trash2, Briefcase, GraduationCap, Award, Languages, Wrench, FileText, ChevronLeft } from 'lucide-react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { User, userService, ResumeData } from '@/services/user.service';

interface EditResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdate: () => void;
}

// Resume Data Structures imported from user.service.ts

const categories = [
    { id: 'work_experiences', label: 'سوابق کاری', icon: Briefcase },
    { id: 'educations', label: 'تحصیلات', icon: GraduationCap },
    { id: 'certificates', label: 'گواهینامه ها', icon: FileText },
    { id: 'awards', label: 'جوایز و تقدیرنامه ها', icon: Award },
    { id: 'skills', label: 'مهارت ها', icon: Wrench },
    { id: 'languages', label: 'زبان ها', icon: Languages },
];

const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100";
const halfInputClass = "w-1/2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

export default function EditResumeModal({ isOpen, onClose, user, onUpdate }: EditResumeModalProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

    // Field Arrays for each category
    const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control, name: 'work_experiences' });
    const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'educations' });
    const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: 'certificates' });
    const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({ control, name: 'awards' });
    const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control, name: 'skills' });
    const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control, name: 'languages' });

    useEffect(() => {
        if (user?.profile?.resume) {
            reset(user.profile.resume as ResumeData);
        }
    }, [user, reset]);

    const onSubmit: SubmitHandler<ResumeData> = async (data) => {
        try {
            await userService.updateProfile({
                resume: data,
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to update resume', error);
        }
    };

    const renderSubModalContent = () => {
        switch (activeCategory) {
            case 'work_experiences':
                return (
                    <div className="space-y-4">
                        <button type="button" onClick={() => appendWork({ company: '', job_title: '', start_date: '', end_date: '' })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            <Plus className="w-5 h-5" />
                            سوابق کاری رو اضافه کن
                        </button>
                        {workFields.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => removeWork(index)} className="absolute top-2 left-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                <input {...register(`work_experiences.${index}.company`)} placeholder="اسم شرکت" className={inputClass} />
                                <input {...register(`work_experiences.${index}.job_title`)} placeholder="عنوان شغلی" className={inputClass} />
                                <div className="flex gap-2">
                                    <input {...register(`work_experiences.${index}.start_date`)} placeholder="تاریخ شروع" className={halfInputClass} />
                                    <input {...register(`work_experiences.${index}.end_date`)} placeholder="تاریخ پایان" className={halfInputClass} />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'educations':
                return (
                    <div className="space-y-4">
                        <button type="button" onClick={() => appendEdu({ university: '', degree: '', field: '', start_date: '', end_date: '' })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            <Plus className="w-5 h-5" />
                            سوابق تحصیلی رو اضافه کن
                        </button>
                        {eduFields.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => removeEdu(index)} className="absolute top-2 left-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                <input {...register(`educations.${index}.university`)} placeholder="اسم دانشگاه/موسسه" className={inputClass} />
                                <input {...register(`educations.${index}.degree`)} placeholder="مقطع تحصیلی" className={inputClass} />
                                <input {...register(`educations.${index}.field`)} placeholder="رشته تحصیلی" className={inputClass} />
                                <div className="flex gap-2">
                                    <input {...register(`educations.${index}.start_date`)} placeholder="تاریخ شروع" className={halfInputClass} />
                                    <input {...register(`educations.${index}.end_date`)} placeholder="تاریخ پایان" className={halfInputClass} />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'certificates':
                return (
                    <div className="space-y-4">
                        <button type="button" onClick={() => appendCert({ title: '', issuer: '', date: '' })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            <Plus className="w-5 h-5" />
                            گواهینامه‌هات رو اضافه کن
                        </button>
                        {certFields.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => removeCert(index)} className="absolute top-2 left-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                <input {...register(`certificates.${index}.title`)} placeholder="عنوان گواهی" className={inputClass} />
                                <input {...register(`certificates.${index}.issuer`)} placeholder="صادر کننده" className={inputClass} />
                                <input {...register(`certificates.${index}.date`)} placeholder="تاریخ صدور" className={inputClass} />
                            </div>
                        ))}
                    </div>
                );
            case 'awards':
                return (
                    <div className="space-y-4">
                        <button type="button" onClick={() => appendAward({ title: '', issuer: '', date: '' })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            <Plus className="w-5 h-5" />
                            جوایز و تقدیرنامه‌هات رو اضافه کن
                        </button>
                        {awardFields.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => removeAward(index)} className="absolute top-2 left-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                <input {...register(`awards.${index}.title`)} placeholder="عنوان جایزه" className={inputClass} />
                                <input {...register(`awards.${index}.issuer`)} placeholder="اهدا کننده" className={inputClass} />
                                <input {...register(`awards.${index}.date`)} placeholder="تاریخ" className={inputClass} />
                            </div>
                        ))}
                    </div>
                );
            case 'skills':
                return (
                    <div className="space-y-4">
                        <button type="button" onClick={() => appendSkill({ name: '', level: '' })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            <Plus className="w-5 h-5" />
                            مهارت‌هات رو اضافه کن
                        </button>
                        {skillFields.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => removeSkill(index)} className="absolute top-2 left-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                <input {...register(`skills.${index}.name`)} placeholder="نام مهارت" className={inputClass} />
                                <input {...register(`skills.${index}.level`)} placeholder="سطح (مثلا: پیشرفته)" className={inputClass} />
                            </div>
                        ))}
                    </div>
                );
            case 'languages':
                return (
                    <div className="space-y-4">
                        <button type="button" onClick={() => appendLang({ name: '', level: '' })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            <Plus className="w-5 h-5" />
                            زبان‌هات رو اضافه کن
                        </button>
                        {langFields.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-xl space-y-3 relative">
                                <button type="button" onClick={() => removeLang(index)} className="absolute top-2 left-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                <input {...register(`languages.${index}.name`)} placeholder="نام زبان" className={inputClass} />
                                <input {...register(`languages.${index}.level`)} placeholder="سطح (مثلا: native)" className={inputClass} />
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[30px] border border-white/70 bg-white p-6 text-right align-middle shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 mb-4 text-center flex items-center justify-between">
                                    {activeCategory ? (
                                        <button onClick={() => setActiveCategory(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                    ) : <div className="w-8" />}

                                    <span>{activeCategory ? categories.find(c => c.id === activeCategory)?.label : 'رزومه ساز'}</span>

                                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                                        <X className="w-6 h-6" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    {!activeCategory ? (
                                        <div className="space-y-3">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setActiveCategory(cat.id)}
                                                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-xl bg-white p-2 text-rose-600 shadow-sm">
                                                            <cat.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-bold text-gray-700">{cat.label}</span>
                                                    </div>
                                                    <Plus className="w-5 h-5 text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        renderSubModalContent()
                                    )}

                                    {/* Footer Buttons - Only show on main view or if we want to allow saving from sub-views */}
                                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 font-bold text-white transition hover:from-rose-600 hover:to-orange-600"
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
