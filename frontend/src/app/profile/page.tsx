'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService, User, UserProfile } from '@/services/user.service';
import { User as UserIcon, MapPin, FileText, Globe, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<UserProfile>({
        display_name: '',
        headline: '',
        about_me: '',
        country: '',
        city: '',
        website_url: '',
    });

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const userData = await userService.getMe();
            setUser(userData);
            if (userData.profile) {
                setFormData({
                    display_name: userData.profile.display_name || '',
                    headline: userData.profile.headline || '',
                    about_me: userData.profile.about_me || '',
                    country: userData.profile.country || '',
                    city: userData.profile.city || '',
                    website_url: userData.profile.website_url || '',
                });
            } else {
                // Initialize display name from user data if profile is empty
                // But schema requires display_name in profile. 
                // If profile is null, we might want to set a default.
                setFormData(prev => ({ ...prev, display_name: 'User' }));
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await userService.updateProfile(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Failed to update profile', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-indigo-600 px-8 py-10 text-white text-center">
                        <div className="inline-block p-1 rounded-full bg-white/20 mb-4">
                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-indigo-600 text-4xl font-bold">
                                {user?.profile?.avatar_url ? (
                                    <img src={user.profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    (formData.display_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                                )}
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold">{formData.display_name || 'User'}</h1>
                        <p className="text-indigo-100 mt-2">{user?.email}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {message && (
                            <div
                                className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Display Name */}
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="display_name"
                                        required
                                        value={formData.display_name}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Your Name"
                                    />
                                </div>
                            </div>

                            {/* Headline */}
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="headline"
                                        value={formData.headline}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g. Chinese Teacher"
                                    />
                                </div>
                            </div>

                            {/* Location (Country & City) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Country"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="City"
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="url"
                                        name="website_url"
                                        value={formData.website_url}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            {/* About Me */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                                <textarea
                                    name="about_me"
                                    rows={4}
                                    value={formData.about_me}
                                    onChange={handleChange}
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="-ml-1 mr-2 h-5 w-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
