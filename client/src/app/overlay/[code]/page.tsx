export const dynamic = "force-dynamic";

import ObsOverlay from "@/components/game/ObsOverlay";

interface OverlayPageProps {
    params: {
        code: string;
    };
}

export default function OverlayPage({ params }: OverlayPageProps) {
    return <ObsOverlay gameCode={params.code} />;
}
