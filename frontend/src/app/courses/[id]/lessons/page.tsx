"use client";

import { useParams } from "next/navigation";
import { redirect } from "next/navigation";

export default function LessonsRedirectPage() {
    const params = useParams();
    const courseId = params?.id;

    // Redirect to the main course detail page which now includes the lesson list
    redirect(`/courses/${courseId}`);
}
