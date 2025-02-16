import { fetchPublicGames } from "@/lib/game";
import JoinButton from "./JoinButton";
import RefreshButton from "./RefreshButton";

export default async function PublicGames() {
  const games = await fetchPublicGames();

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-2 text-2xl font-bold leading-tight">
        Public games <RefreshButton />
      </h2>

      {games && games.length === 0 ? (
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5 text-center text-2xl underline">No games available</div>
          <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <div className="bg-base-200 h-80 max-h-80 overflow-y-auto rounded-xl">
          <table className="table-compact lg:table-normal table-zebra table rounded-none">
            <thead>
              <tr>
                <th className="w-48">Host</th>
                <th className="w-48">Opponent</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {games && games.length > 0 ? (
                games.map((game) => (
                  <tr key={game.code} className="group">
                    <td
                      className={
                        typeof game.host?.id === "number" ? "text-primary" : ""
                      }
                    >
                      {game.host?.name}
                    </td>
                    <td
                      className={
                        typeof (game.host?.id === game.white?.id
                          ? game.black?.id
                          : game.white?.id) === "number"
                          ? "text-primary"
                          : ""
                      }
                    >
                      {(game.host?.id === game.white?.id
                        ? game.black?.name
                        : game.white?.name) || ""}
                    </td>
                    <th>
                      <JoinButton code={game.code as string} />
                    </th>
                  </tr>
                ))
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
