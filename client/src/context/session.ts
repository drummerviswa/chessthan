import type { User } from "@/types_config/index";
import { createContext, Dispatch, SetStateAction } from "react";

export const SessionContext = createContext<{
    user: User | null | undefined; // undefined = hasn't been checked yet, null = no user
    setUser: Dispatch<SetStateAction<User | null>>;
} | null>(null);
