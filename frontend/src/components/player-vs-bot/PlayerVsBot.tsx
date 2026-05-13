import type {
  GameActionProps,
  PlayerVsBotProps,
} from "../../types/commonTypes";
import { useEffect, useState } from "react";
import type { WrapperViewState, GameData } from "../../types/commonTypes";
import type { GameStateUpdateDto } from "../../types/dtos/commonDtos";
import CreateGameLobby from "./create-game-lobby/CreateGameLobby";
import Game from "../game/Game";
import GameEnd from "./game-end/GameEnd";
import { useContext } from "react";
import { GameModeSocket } from "../../api/GameModeSocket";

export default function PlayerVsBot({ setHomeView }: PlayerVsBotProps) {
  const [view, setView] = useState<WrapperViewState>("LOBBY");
  // const [errMsg, setErrMsg] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameData | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
  const [actionContext, setActionContext] = useState<GameActionProps | null>(
    null,
  );

  const socket = useContext(GameModeSocket)!;

  useEffect(() => {
    socket.connect();

    socket.on("game-state-update", (data: GameStateUpdateDto) => {
      const { actionType }: GameStateUpdateDto = data;
      if (actionType === "create-game") {
        setView("GAME");
      }
      setGameState(data.gameState);
      setActionContext({
        actionType: data.actionType,
        actionSocketId: data.socketId!,
        isActionLocked: false,
        playedCards: data.playedCards,
        cardDrew: data.cardDrew,
        unoPenalty: data.unoPenalty,
      });
    });

    socket.on("validation-exception", (data) => {
      console.log(data);
    });
    socket.on("room-exception", (data) => {
      console.log(data);
    });
    socket.on("game-exception", (data) => {
      console.log(data);
    });

    return () => {
      socket.disconnect();
      socket.off("game-state-update");
      socket.off("validation-exception");
      socket.off("room-exception");
      socket.off("game-exception");
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function continueGame(): void {
    socket.emit("create-game", {
      maxPlayers: maxPlayers,
    });
  }

  if (view === "LOBBY") {
    return (
      <CreateGameLobby
        setHomeView={setHomeView}
        setMaxPlayers={setMaxPlayers}
      />
    );
  }
  if (view === "GAME") {
    return (
      <>
        <Game gameState={gameState!} actionContext={actionContext!} />
        {actionContext!.actionType === "game-ended" && (
          <GameEnd setHomeView={setHomeView} continueGame={continueGame} />
        )}
      </>
    );
  }
}
