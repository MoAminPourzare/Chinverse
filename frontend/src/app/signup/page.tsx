'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phone: '',
        display_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.signup(formData);
            // Auto login logic can be added here
            router.push('/login');
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { detail?: string } } };
            const errorMessage = apiError.response?.data?.detail || 'ثبت نام ناموفق بود. لطفا مجددا تلاش کنید.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-gray-50 font-sans flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8">

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">ایجاد حساب کاربری</h1>
                    <p className="text-gray-500">لطفا اطلاعات خود را وارد کنید</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-center rounded-lg">
                        <AlertCircle className="w-5 h-5 ml-2" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <div className="relative group">
                        <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-orange-500">
                            نام و نام خانوادگی
                        </label>
                        <input
                            type="text"
                            name="display_name"
                            value={formData.display_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-orange-500 transition-colors placeholder-gray-300"
                            placeholder="نام خود را وارد کنید"
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative group">
                        <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-blue-700">
                            ایمیل
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            dir="ltr"
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-blue-700 transition-colors placeholder-gray-300"
                            placeholder="example@mail.com"
                        />
                    </div>

                    {/* Phone Input */}
                    <div className="relative group">
                        <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-orange-500">
                            شماره موبایل
                        </label>
                        <input
                            type="text"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            dir="ltr"
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-orange-500 transition-colors placeholder-gray-300"
                            placeholder="09120000000"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-blue-700">
                            رمز عبور
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            dir="ltr"
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-blue-700 transition-colors placeholder-gray-300"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-800 transition-colors disabled:opacity-70 flex justify-center items-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin ml-2 h-5 w-5" />
                                    <span>در حال ثبت نام...</span>
                                </>
                            ) : (
                                'ثبت نام'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        قبلا ثبت نام کرده‌اید؟{' '}
                        <Link href="/login" className="font-bold text-blue-700 hover:text-blue-800">
                            وارد شوید
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}