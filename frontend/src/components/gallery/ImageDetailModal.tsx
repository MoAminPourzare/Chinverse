"use client";

import { GalleryItem } from "@/services/gallery.service";
import PostViewerModal from "@/components/engagement/PostViewerModal";

interface ImageDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: GalleryItem | null;
}

export default function ImageDetailModal({ isOpen, onClose, item }: ImageDetailModalProps) {
    return (
        <PostViewerModal
            isOpen={isOpen}
            onClose={onClose}
            post={item}
            fallbackTitle="پست گالری"
        />
    );
}
