"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useContext, useState } from "react";

import { SessionContext } from "@/context/session";
import { createGame } from "@/lib/game";

export default function CreateGame() {
  const session = useContext(SessionContext);
  const [buttonLoading, setButtonLoading] = useState(false);
  const router = useRouter();

  async function submitCreateGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setButtonLoading(true);

    const target = e.target as HTMLFormElement;
    const unlisted = target.elements.namedItem("createUnlisted") as HTMLInputElement;
    const startingSide = (target.elements.namedItem("createStartingSide") as HTMLSelectElement).value;
    const variant = (target.elements.namedItem("createVariant") as HTMLSelectElement).value;

    const game = await createGame(startingSide, unlisted.checked, variant);

    if (game) {
      router.push(`/${game.code}`);
    } else {
      setButtonLoading(false);
    }
  }

  return (
    <form className="form-control gap-2.5" onSubmit={submitCreateGame}>
      <label className="hidden label cursor-pointer">
        <span className="label-text">Unlisted/invite-only</span>
        <input type="checkbox" className="checkbox" name="createUnlisted" id="createUnlisted" />
      </label> 
      
      <div className="flex gap-2 w-full">
        {/* Color Choice */}
        <select
          className="select select-bordered select-xs flex-1 text-xs font-semibold"
          name="createStartingSide"
          id="createStartingSide"
        >
          <option value="random">Random Color</option>
          <option value="white">Play White</option>
          <option value="black">Play Black</option>
        </select>

        {/* Variant Choice */}
        <select
          className="select select-bordered select-xs flex-1 text-xs font-semibold"
          name="createVariant"
          id="createVariant"
        >
          <option value="standard">Standard Chess</option>
          <option value="chess960">Chess960 (Fischer)</option>
          <option value="kingofthehill">King of the Hill</option>
          <option value="threecheck">3-Check Chess</option>
        </select>
      </div>

      <button
        className={
          "btn btn-xs btn-primary font-bold w-full h-8 normal-case" +
          (buttonLoading ? " loading" : "") +
          (!session?.user?.id ? " btn-disabled text-base-content" : "")
        }
        type="submit"
      >
        Launch Custom Game
      </button>
    </form>
  );
}
