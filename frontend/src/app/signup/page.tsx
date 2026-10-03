import { Suspense } from "react";
import SignupLegalDialog from "@/components/auth/SignupLegalDialog";

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupLegalDialog />
        </Suspense>
    );
}
