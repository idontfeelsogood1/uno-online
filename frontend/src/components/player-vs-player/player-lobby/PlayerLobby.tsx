import { useState, useEffect } from "react";
import type { PlayerLobbyProps } from "../../../types/commonTypes";
import { useContext } from "react";
import { GameModeSocket } from "../../../api/GameModeSocket";

export default function PlayerLobby({
  lobbyState,
  setHomeView,
}: PlayerLobbyProps) {
  const [usernameInputValue, setUsernameInputValue] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);
  const [roomNameInputValue, setRoomNameInputValue] = useState<string>("");
  const [selectedRoomSize, setSelectedRoomSize] = useState<number>(3);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);

  const socket = useContext(GameModeSocket)!;

  function updateLobbyState() {
    socket.emit("get-lobby");
  }

  function joinRoom(roomId: string) {
    socket.emit("join-room", {
      roomToJoinId: roomId,
      username: username,
    });
  }

  function createRoom(username: string, roomname: string, maxPlayers: number) {
    socket.emit("create-room", {
      username: username,
      roomname: roomname,
      maxPlayers: maxPlayers,
    });
  }

  useEffect(() => {
    updateLobbyState();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!username) {
    return (
      <dialog
        open
        className="flex flex-col text-center gap-3 p-3 fixed inset-0 m-auto h-fit z-99 border"
      >
        <h1>Enter Username</h1>
        <input
          type="text"
          value={usernameInputValue}
          onChange={(e) => {
            setUsernameInputValue(e.target.value);
          }}
          className="border"
        />
        <button
          onClick={() => {
            setUsername(usernameInputValue);
          }}
          className="border"
        >
          OK
        </button>
        <button
          onClick={() => {
            setHomeView(null);
          }}
          className="border"
        >
          CLOSE
        </button>
      </dialog>
    );
  }

  // FIGURE OUT OF TO CENTER A DIALOG
  if (isCreatingRoom) {
    return (
      <dialog
        open
        className="flex flex-col gap-3 p-3 text-center fixed inset-0 m-auto h-fit z-99 border"
      >
        <h1>Create room</h1>
        <input
          type="text"
          value={roomNameInputValue}
          onChange={(e) => {
            setRoomNameInputValue(e.target.value);
          }}
          className="border"
        />
        <div>Max Players</div>
        <div className="flex gap-3 justify-center border">
          <input
            type="radio"
            name="roomSize"
            value={2}
            onChange={(e) => {
              setSelectedRoomSize(parseInt(e.target.value));
            }}
          />
          <span>2</span>
          <input
            type="radio"
            name="roomSize"
            value={3}
            onChange={(e) => {
              setSelectedRoomSize(parseInt(e.target.value));
            }}
            defaultChecked
          />
          <span>3</span>
          <input
            type="radio"
            name="roomSize"
            value={4}
            onChange={(e) => {
              setSelectedRoomSize(parseInt(e.target.value));
            }}
          />
          <span>4</span>
        </div>
        <button
          onClick={() => {
            createRoom(username, roomNameInputValue, selectedRoomSize);
          }}
          className="border"
        >
          CREATE
        </button>
        <button
          onClick={() => {
            setIsCreatingRoom(false);
          }}
          className="border"
        >
          BACK
        </button>
      </dialog>
    );
  }

  return (
    <dialog
      open
      className="flex flex-col gap-3 p-3 text-center fixed inset-0 m-auto h-fit z-99 border"
    >
      <h1>Room list</h1>
      <ul className="flex flex-col gap-3 p-3 border">
        {lobbyState.map((room) => {
          return (
            <li
              onClick={() => joinRoom(room.roomId)}
              className="flex gap-3 p-3 border"
            >
              <span>{room.roomName}</span>
              <span>
                {room.currentPlayers.length}/{room.maxPlayers}
              </span>
              <span>
                {room.hasRoomStarted ? "Room Started" : "Room Hasn't Started"}
              </span>
            </li>
          );
        })}
      </ul>
      <button onClick={updateLobbyState} className="border">
        REFRESH
      </button>
      <button
        onClick={() => {
          setIsCreatingRoom(true);
        }}
        className="border"
      >
        CREATE ROOM
      </button>
      <button
        onClick={() => {
          setHomeView(null);
        }}
        className="border"
      >
        BACK
      </button>
    </dialog>
  );
}
