'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { LogOut, User, LayoutDashboard, BookOpen } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // چک کردن وجود توکن در لحظه لود شدن صفحه
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        setLoading(false);
    }, []);

    const handleLogout = () => {
        authService.logout();
        setIsLoggedIn(false);
        router.refresh();
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-indigo-600">ChinVerse</h1>
                <div>
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-600 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    ) : (
                        <div className="space-x-4">
                            <Link href="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
                            <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Get Started</Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto mt-10 p-6">
                {isLoggedIn ? (
                    // نمای داشبورد (وقتی لاگین است)
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back! 👋</h2>
                            <p className="text-gray-500">You are successfully logged in to ChinVerse.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex items-center space-x-4 cursor-pointer hover:bg-indigo-100 transition">
                                <div className="bg-indigo-200 p-3 rounded-full text-indigo-700">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-900">My Courses</h3>
                                    <p className="text-sm text-indigo-700">Continue learning Chinese</p>
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex items-center space-x-4 cursor-pointer hover:bg-emerald-100 transition">
                                <div className="bg-emerald-200 p-3 rounded-full text-emerald-700">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-900">My Profile</h3>
                                    <p className="text-sm text-emerald-700">Update your resume & info</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // نمای لندینگ (وقتی لاگین نیست)
                    <div className="text-center mt-20">
                        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
                            Master Chinese <br /> with <span className="text-indigo-600">ChinVerse</span>
                        </h2>
                        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                            The ultimate platform for learning, networking, and exploring the Chinese language community in Iran.
                        </p>
                        <Link
                            href="/signup"
                            className="inline-block px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-transform"
                        >
                            Start Your Journey
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}