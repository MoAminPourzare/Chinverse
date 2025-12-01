import api from '@/lib/api';

export interface GalleryItem {
    id: number;
    user_id: number;
    image_url: string;
    caption?: string;
    created_at: string;
    updated_at: string;
}

export const galleryService = {
    async getGallery(): Promise<GalleryItem[]> {
        const response = await api.get<GalleryItem[]>('/users/me/gallery');
        return response.data;
    },

    async uploadImage(file: File, caption?: string): Promise<GalleryItem> {
        const formData = new FormData();
        formData.append('file', file);
        if (caption) {
            formData.append('caption', caption);
        }

        const response = await api.post<GalleryItem>('/users/me/gallery', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async deleteImage(id: number): Promise<void> {
        await api.delete(`/users/me/gallery/${id}`);
    },
};
