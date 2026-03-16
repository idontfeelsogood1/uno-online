import PlayerLobby from "./PlayerLobby/PlayerLobby";
import Room from "./Room/Room";
import Game from "./Game/Game";
import GameEnd from "./Game/GameEnd/GameEnd";
import { useState, useEffect } from "react";
import type {
  PlayerVsPlayerProps,
  WrapperViewState,
  RoomData,
  GameData,
  GameStateActionType,
} from "../../../types/commonTypes";
import type {
  RoomStateUpdateDto,
  GameStateUpdateDto,
  RoomDto,
  LobbyStateUpdateDto,
} from "../../../types/dtos/commonDtos";
import { socket } from "../../../api/socket";

export default function PlayerVsPlayer({ setHomeView }: PlayerVsPlayerProps) {
  const [view, setView] = useState<WrapperViewState>("LOBBY");
  // const [errMsg, setErrMsg] = useState<string | null>(null);
  const [lobbyState, setLobbyState] = useState<RoomData[]>([]);
  const [roomState, setRoomState] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameData | null>(null);
  const [actionSocketId, setActionSocketId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<GameStateActionType | null>(
    null,
  );

  useEffect(() => {
    socket.connect();

    socket.on("lobby-state-update", (data: LobbyStateUpdateDto) => {
      const { actionType }: LobbyStateUpdateDto = data;
      if (actionType === "get-lobby") {
        setLobbyState(data.lobbyState);
      }
    });

    socket.on("room-state-update", (data: RoomStateUpdateDto) => {
      const { actionType }: RoomStateUpdateDto = data;
      if (actionType === "create-room" || actionType === "join-room") {
        setRoomState(data.roomState);
        setView("ROOM");
      }
      if (actionType === "join-room") {
        setRoomState(data.roomState);
        setView("ROOM");
      }
      if (actionType === "leave-room") {
        setRoomState(null);
        setView("LOBBY");
      }
      if (actionType === "player-joined-room") {
        setRoomState(data.roomState);
      }
      if (actionType === "player-left-room") {
        setRoomState(data.roomState);
      }
    });

    socket.on("game-state-update", (data: GameStateUpdateDto) => {
      const { actionType }: GameStateUpdateDto = data;
      if (actionType === "game-started") {
        setView("GAME");
        socket.emit("get-room-state", (ack: RoomDto) => {
          setRoomState(ack.roomState);
        });
        setGameState(data.gameState);
        setActionSocketId(socket.id!);
        setActionType(data.actionType);
      } else {
        socket.emit("get-room-state", (ack: RoomDto) => {
          setRoomState(ack.roomState);
        });
        setGameState(data.gameState);
        setActionSocketId(data.socketId!);
        setActionType(data.actionType);
      }
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
      socket.off("lobby-state-update");
      socket.off("room-state-update");
      socket.off("game-state-update");
      socket.off("validation-exception");
      socket.off("room-exception");
      socket.off("game-exception");
    };
  }, []);

  function continueGame() {
    setGameState(gameState);
    setActionType("game-started");
    setActionType(null);
  }

  if (view === "LOBBY") {
    return <PlayerLobby lobbyState={lobbyState} setHomeView={setHomeView} />;
  }
  if (view === "ROOM") {
    return <Room roomState={roomState!} />;
  }
  if (view === "GAME") {
    return (
      <>
        <Game
          gameState={gameState!}
          actionType={actionType!}
          actionSocketId={actionSocketId!}
        />
        {/* CLICKING HOME AND CONTINUE DOES NOTHING */}
        {/* CONSIDER EDGE CASE WHEN CONTINUING WITH ONLY 1 PLAYER LEFT, EITHER LEAVE ROOM OR DO SOMETHING ELSE */}
        {actionType === "game-ended" && (
          <GameEnd
            players={roomState!.currentPlayers}
            ownerSocketId={roomState!.ownerSocketId}
            setHomeView={() => setHomeView(null)}
            continueGame={continueGame}
          />
        )}
      </>
    );
  }
}
