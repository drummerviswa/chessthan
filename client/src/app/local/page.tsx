import { Suspense } from "react";
import LocalPage from "@/components/game/LocalPage";

export const metadata = {
    title: "Chessthan - Local Play",
    description: "Play chess offline on the same device or against computer bots."
};

export default function LocalRoute() {
    return (
        <div className="w-full flex items-center justify-center min-h-[80vh]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <div className="text-sm mt-3 text-base-content/50">Loading local arena...</div>
                </div>
            }>
                <LocalPage />
            </Suspense>
        </div>
    );
}
