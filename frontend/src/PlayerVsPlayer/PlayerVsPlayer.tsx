interface PlayerVsPlayerProps {
  setHomeView: (view: null) => void;
}

export default function PlayerVsPlayer({ setHomeView }: PlayerVsPlayerProps) {
  return (
    <dialog open>
      <div>PlayerVsPlayer component</div>
      <button onClick={() => setHomeView(null)}>Exit</button>
    </dialog>
  );
}
