import { IconUser } from "@tabler/icons-react";
import ThemeToggle from "./ThemeToggle";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="navbar border-base-300 dark:border-neutral mx-1 w-auto justify-center border-b-2 md:mx-16 lg:mx-40">
      <Link href={"/"} className="flex flex-1 items-center gap-2">
        <Image src="/gaming.png" alt="chessthan" width={40} height={40} />
        <h1 className="font-bold">Chessthan</h1>
      </Link>
      <div className="flex-none">
        <ThemeToggle />
        <label tabIndex={0} htmlFor="auth-modal" className="btn btn-ghost btn-circle avatar">
          <div className="w-10 rounded-full">
            <IconUser className="m-auto block h-full" />
          </div>
        </label>
      </div>
    </header>
  );
}
