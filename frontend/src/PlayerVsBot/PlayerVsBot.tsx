interface PlayerVsBotProps {
  setHomeView: (view: null) => void;
}

export default function PlayerVsBot({ setHomeView }: PlayerVsBotProps) {
  return (
    <dialog open>
      <div>PlayerVsBot component</div>
      <button onClick={() => setHomeView(null)}>Exit</button>
    </dialog>
  );
}
