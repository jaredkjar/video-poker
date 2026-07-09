interface Props {
  note: string;
  format: (amount: number) => string;
  startingBalance: number;
  onAdd: (amount: number) => void;
  onReset: () => void;
  onClose: () => void;
}

const AMOUNTS = [100, 500, 1000];

export function CreditsModal({ note, format, startingBalance, onAdd, onReset, onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Add Credits</h2>
        {note && <p className="modal-note">{note}</p>}
        <p className="modal-sub">It's all play money — top up whenever you like.</p>
        <div className="modal-amounts">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" onClick={() => onAdd(a)}>
              +{format(a)}
            </button>
          ))}
        </div>
        <button type="button" className="modal-link danger" onClick={onReset}>
          Clear balance — start over at {format(startingBalance)}
        </button>
      </div>
    </div>
  );
}
