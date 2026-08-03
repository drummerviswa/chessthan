import type { User } from "@/types_config/index";
import { createContext, Dispatch, SetStateAction } from "react";

// undefined = still loading (not yet checked)
// null = checked, no user logged in
// User = logged in user
export const SessionContext = createContext<{
    user: User | null | undefined;
    setUser: Dispatch<SetStateAction<User | null | undefined>>;
} | null>(null);
