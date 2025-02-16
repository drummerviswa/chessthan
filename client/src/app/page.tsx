import CreateGame from "@/components/home/CreateGame";
import JoinGame from "@/components/home/JoinGame";
import PublicGames from "@/components/home/PublicGames/PublicGames";
import Image from "next/image";
import 'animate.css';


export const revalidate = 0;

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row w-full items-center justify-center p-4 md:p-8 space-y-6 md:space-y-0">
    {/* Left Section - Image & Title */}
    <div className="flex-1 flex flex-col items-center text-center space-y-4">
      <h2 className="text-3xl md:text-4xl font-medium animate__animated animate__slideInDown">
        <span className="font-bold">Chessthan</span> - An online multiplayer chess platform
      </h2>
      <Image
        src={"/chess.svg"}
        alt="Chess"
        width={500}
        height={500}
        className="max-w-[80%] md:max-w-full animate__animated animate__jackInTheBox"
      />
    </div>

    {/* Right Section - Content */}
    <div className="flex-1 flex flex-col items-center space-y-6 w-full animate__animated animate__slideInUp">
      <PublicGames />
      <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
        {/* Create Game */}
        <div className="flex flex-col items-center w-full md:w-auto">
          <h2 className="mb-3 text-lg md:text-xl font-bold">Create game</h2>
          <CreateGame />
        </div>

        {/* Join Game */}
        <div className="flex flex-col items-center w-full md:w-auto">
          <h2 className="mb-3 text-lg md:text-xl font-bold">Join from invite</h2>
          <JoinGame />
        </div>
      </div>
    </div>
  </div>
  );
}
