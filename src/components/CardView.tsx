import { isRed, rankLabel, suitChar, type Card } from '../game/cards';

interface Props {
  card: Card | null;
  faceUp: boolean;
  held: boolean;
  hinted: boolean;
  clickable: boolean;
  onClick: () => void;
}

export function CardView({ card, faceUp, held, hinted, clickable, onClick }: Props) {
  const showFace = faceUp && card !== null;
  return (
    <div className="card-slot">
      <div className={`hold-badge${held ? ' show' : ''}`}>HELD</div>
      <button
        type="button"
        className={`card${showFace ? ' up' : ''}${held ? ' held' : ''}${hinted ? ' hinted' : ''}`}
        disabled={!clickable}
        onClick={onClick}
        aria-label={showFace ? `${rankLabel(card)} of ${suitChar(card)}${held ? ', held' : ''}` : 'face-down card'}
      >
        <div className="card-inner">
          <div className="face back" />
          <div className={`face front ${card !== null && isRed(card) ? 'red' : 'black'}`}>
            {card !== null && (
              <>
                <div className="corner tl">
                  <span>{rankLabel(card)}</span>
                  <span>{suitChar(card)}</span>
                </div>
                <div className="pip">{suitChar(card)}</div>
                <div className="corner br">
                  <span>{rankLabel(card)}</span>
                  <span>{suitChar(card)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
