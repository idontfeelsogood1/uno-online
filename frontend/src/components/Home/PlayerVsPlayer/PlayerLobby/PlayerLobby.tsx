import { useState, useEffect } from "react";
import { socket } from "../../../../api/socket";
import type { PlayerLobbyProps } from "../../../../types/commonTypes";

export default function PlayerLobby({
  lobbyState,
  setHomeView,
}: PlayerLobbyProps) {
  const [usernameInputValue, setUsernameInputValue] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);
  const [roomNameInputValue, setRoomNameInputValue] = useState<string>("");
  const [selectedRoomSize, setSelectedRoomSize] = useState<number>(3);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);

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
  }, []);

  if (!username) {
    return (
      <dialog open>
        <h1>Enter Username</h1>
        <input
          type="text"
          value={usernameInputValue}
          onChange={(e) => {
            setUsernameInputValue(e.target.value);
          }}
        />
        <button
          onClick={() => {
            setUsername(usernameInputValue);
          }}
        >
          OK
        </button>
        <button
          onClick={() => {
            setHomeView(null);
          }}
        >
          CLOSE
        </button>
      </dialog>
    );
  }

  if (isCreatingRoom) {
    return (
      <dialog open>
        <h1>Create room</h1>
        <input
          type="text"
          value={roomNameInputValue}
          onChange={(e) => {
            setRoomNameInputValue(e.target.value);
          }}
        />
        <div>Max Players: </div>
        <div>
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
        >
          CREATE
        </button>
        <button
          onClick={() => {
            setIsCreatingRoom(false);
          }}
        >
          BACK
        </button>
      </dialog>
    );
  }

  return (
    <dialog open>
      <h1>Room list</h1>
      <ul>
        {lobbyState.map((room) => {
          return (
            <li onClick={() => joinRoom(room.roomId)}>
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
      <button onClick={updateLobbyState}>REFRESH</button>
      <button
        onClick={() => {
          setIsCreatingRoom(true);
        }}
      >
        CREATE ROOM
      </button>
      <button
        onClick={() => {
          setHomeView(null);
        }}
      >
        BACK
      </button>
    </dialog>
  );
}
