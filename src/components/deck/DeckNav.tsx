"use client";

type Props = {
  current: number;
  total: number;
  tone: "paper" | "ink";
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
};

export function DeckNav({ current, total, tone, onPrev, onNext, onJump }: Props) {
  return (
    <div className="deck-nav" data-tone={tone}>
      <button
        type="button"
        className="deck-nav__arrow"
        onClick={onPrev}
        disabled={current === 0}
        aria-label="Slide anterior"
      >
        ←
      </button>

      <div className="deck-nav__dots" role="tablist" aria-label="Slides">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`deck-nav__dot${i === current ? " is-active" : ""}`}
            onClick={() => onJump(i)}
            aria-label={`Slide ${i + 1}`}
            aria-selected={i === current}
            role="tab"
          />
        ))}
      </div>

      <div className="deck-nav__counter">
        {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      <button
        type="button"
        className="deck-nav__arrow"
        onClick={onNext}
        disabled={current === total - 1}
        aria-label="Slide seguinte"
      >
        →
      </button>
    </div>
  );
}
