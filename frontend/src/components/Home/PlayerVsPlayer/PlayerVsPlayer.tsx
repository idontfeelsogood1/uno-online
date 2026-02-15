import PlayerLobby from "./PlayerLobby/PlayerLobby";
import Room from "./Room/Room";
import Game from "./Game/Game";
import { useState, useEffect } from "react";
import type {
  PlayerVsPlayerProps,
  WrapperViewState,
  RoomData,
  GameData,
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
      } else {
        socket.emit("get-room-state", (ack: RoomDto) => {
          setRoomState(ack.roomState);
        });
        setGameState(data.gameState);
        setActionSocketId(data.socketId!);
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

  if (view === "LOBBY") {
    return <PlayerLobby lobbyState={lobbyState} setHomeView={setHomeView} />;
  }
  if (view === "ROOM") {
    return <Room roomState={roomState!} />;
  }
  if (view === "GAME") {
    return <Game gameState={gameState!} actionSocketId={actionSocketId!} />;
  }
}
