import { NavigationLoadingBar } from "@/components/ui/loading";

// Root Dashboard Layout
// Handles structural elements common to all dashboard views, but NOT tenant-specific data
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <NavigationLoadingBar />
            {children}
        </>
    )
}
