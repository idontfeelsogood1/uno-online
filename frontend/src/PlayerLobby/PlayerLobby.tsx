import { useState } from "react";

interface PlayerLobbyProps {
  setHomeView: (view: null) => void;
  setWrapperView: (view: string) => void;
}

export default function PlayerLobby({
  setHomeView,
  setWrapperView,
}: PlayerLobbyProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);

  if (!username) {
    return (
      <dialog open>
        <div>Enter Username</div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
        <button
          onClick={() => {
            setUsername(inputValue);
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

  return (
    <dialog open>
      <div>Room list</div>
      <ul>
        <li>Example room</li>
      </ul>
      <button>REFRESH</button>
      <button>CREATE ROOM</button>
      <button
        onClick={() => {
          setHomeView(null);
        }}
      >
        EXIT
      </button>
    </dialog>
  );
}
