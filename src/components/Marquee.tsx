import type { ReactNode } from 'react';

interface Props {
  /** Defaults to the "Jacks or Better" house brand. */
  title?: ReactNode;
  tagline: string;
}

export function Marquee({ title, tagline }: Props) {
  return (
    <header className="marquee">
      <h1>
        {title ?? (
          <>
            Jacks <em>or</em> Better
          </>
        )}
      </h1>
      <div className="tagline">{tagline}</div>
      <div className="byline">Developed by Jared Kjar</div>
    </header>
  );
}
