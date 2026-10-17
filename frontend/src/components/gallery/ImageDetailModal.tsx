"use client";

import { GalleryItem } from "@/services/gallery.service";
import PostViewerModal from "@/components/engagement/PostViewerModal";

interface ImageDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: GalleryItem | null;
    onEdit?: () => void;
    onDelete?: () => Promise<void>;
}

export default function ImageDetailModal({ isOpen, onClose, item, onEdit, onDelete }: ImageDetailModalProps) {
    return (
        <PostViewerModal
            isOpen={isOpen}
            onClose={onClose}
            post={item}
            fallbackTitle="پست گالری"
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
}
