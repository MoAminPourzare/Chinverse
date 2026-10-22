import type { ReactNode } from "react";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupLayout({ children }: { children: ReactNode }) {
    return <SignupForm>{children}</SignupForm>;
}
