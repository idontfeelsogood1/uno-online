import { useState, useEffect } from "react";
import { socket } from "../../api/socket";
import type { PlayerLobbyProps, RoomData } from "../../types/commonTypes";
import type { LobbyDto } from "../../types/dtos/commonDtos";

export default function PlayerLobby({ setHomeView }: PlayerLobbyProps) {
  const [usernameInputValue, setUsernameInputValue] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);
  const [roomNameInputValue, setRoomNameInputValue] = useState<string>("");
  const [selectedRoomSize, setSelectedRoomSize] = useState<number>(3);
  const [lobbyState, setLobbyState] = useState<RoomData[]>([]);
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
    socket.on("get-lobby-success", (data: LobbyDto) => {
      setLobbyState(data.lobbyState);
    });
    updateLobbyState();
    return () => {
      socket.off("get-lobby-success");
    };
  }, []);

  if (!username) {
    return (
      <dialog open>
        <div>Enter Username</div>
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
        <div>Create room</div>
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
            value={2}
            onChange={(e) => {
              setSelectedRoomSize(parseInt(e.target.value));
            }}
          />
          <span>2</span>
          <input
            type="radio"
            value={3}
            onChange={(e) => {
              setSelectedRoomSize(parseInt(e.target.value));
            }}
            defaultChecked
          />
          <span>3</span>
          <input
            type="radio"
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
      <div>Room list</div>
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
