import { NavigationLoadingBar } from "@/components/ui/loading";
import { Suspense } from "react";

// Root Dashboard Layout
// Handles structural elements common to all dashboard views, but NOT tenant-specific data
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={null}>
                <NavigationLoadingBar />
            </Suspense>
            {children}
        </>
    )
}
