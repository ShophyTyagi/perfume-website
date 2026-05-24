// sections.jsx — scrolling content panels
// React hooks (useEffect, useState, useRef) are declared globally by app.jsx which loads after this file.
// Each section declares its bottle "focus" via data-focus attribute
// (cap | neck | shoulder | body | base | full) which app.jsx reads to
// drive the camera transform.

const NOTE_DATA = {
  top: {
    label: 'Top Notes',
    sub: 'First impression · 0 to 15 min',
    items: ['Bergamot', 'Pink Pepper', 'Pear Blossom', 'Wet Petals'],
    quote: '"It opens like dawn through linen, bright and cool, almost edible."',
  },
  heart: {
    label: 'Heart Notes',
    sub: 'The bloom · 15 min to 3 hrs',
    items: ['Centifolia Rose', 'Peony', 'Magnolia', 'Iris Pallida'],
    quote: '"A field of cut peonies, the morning after rain."',
  },
  base: {
    label: 'Base Notes',
    sub: 'The skin · 3 hrs and beyond',
    items: ['White Musk', 'Sandalwood', 'Vanilla Orchid', 'Ambrette'],
    quote: '"The trace it leaves on a sweater hung up at midnight."',
  },
};

const INGREDIENTS = [
  { id: 'rose',     name: 'Centifolia Rose',  origin: 'Grasse, France',   pct: '12%',  x: 38, y: 45, color: '#d4a5a5' },
  { id: 'peony',    name: 'Wild Peony',       origin: 'Yunnan, China',    pct: '8%',   x: 63, y: 49, color: '#e8b8b8' },
  { id: 'iris',     name: 'Iris Pallida',     origin: 'Tuscany, Italy',   pct: '6%',   x: 34, y: 57, color: '#c8a8c0' },
  { id: 'sandal',   name: 'Mysore Sandalwood',origin: 'Karnataka, India', pct: '9%',   x: 66, y: 62, color: '#b8956b' },
  { id: 'musk',     name: 'White Musk',       origin: 'Synthesised',      pct: '4%',   x: 40, y: 70, color: '#e8dcc4' },
  { id: 'vanilla',  name: 'Vanilla Orchid',   origin: 'Madagascar',       pct: '3%',   x: 61, y: 76, color: '#d4b896' },
];

const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz';

function ScrambleText({ text, delay = 0 }) {
  const [chars, setChars] = useState(text.split('').map(c => c === ' ' ? ' ' : '·'));
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const timer = setTimeout(() => {
      let frame = 0;
      const total = 28;
      const iv = setInterval(() => {
        frame++;
        const revealed = Math.min(text.length, Math.floor((frame / total) * text.length * 1.15));
        setChars(text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealed) return ch;
          const r = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          return ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? r.toUpperCase() : r;
        }));
        if (revealed >= text.length) { clearInterval(iv); done.current = true; }
      }, 38);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return <>{chars.map((ch, i) => (
    <span key={i} className="scramble-char">{ch}</span>
  ))}</>;
}

function HeroMotes() {
  return (
    <div className="hero-motes" aria-hidden="true">
      <div className="hero-mote" />
      <div className="hero-mote" />
      <div className="hero-mote" />
      <div className="hero-mote" />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="sect sect-hero" data-focus="capNeck" data-screen-label="01 Hero">
      <div className="hero-dots" aria-hidden="true" />
      <HeroMotes />
      <div className="sect-inner hero-inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-meta">
          <span className="mono">N° 07 · Elixirs Maison</span>
        </div>
        <div className="hero-sparkle-row" aria-hidden="true">
          <span>✦</span><span className="star-lg">✦</span><span>✦</span>
        </div>
        <h1 className="display hero-title">
          <ScrambleText text="Eternal" />{' '}
          <span className="ital"><ScrambleText text="Bloom" delay={220} /></span>
        </h1>
        <p className="hero-tagline">
          Rose, peony, and ambrette. A floral built to outlast the season,
          suspended in skin-light musk.
        </p>
        <div className="hero-foot">
          <span className="hero-arrow">↓</span>
          <span className="mono">Scroll down the bottle</span>
        </div>
      </div>
    </section>
  );
}

function NoteSection({ kind, idx }) {
  const d = NOTE_DATA[kind];
  const focus = kind === 'top' ? 'shoulder' : kind === 'heart' ? 'body' : 'base';
  return (
    <section className={`sect sect-note sect-note-${kind}`} data-focus={focus}
             data-screen-label={`0${idx + 1} ${d.label}`}>
      <div className="sect-inner note-inner">
        <div className="note-index mono">0{idx + 1} / 03</div>
        <div className="note-label mono">{d.sub}</div>
        <h2 className="display note-title">{d.label}</h2>
        <ul className="note-list">
          {d.items.map((it, i) => (
            <li key={i} className="note-item">
              <span className="note-num mono">0{i + 1}</span>
              <span className="note-name">{it}</span>
            </li>
          ))}
        </ul>
        <blockquote className="note-quote">{d.quote}</blockquote>
      </div>
    </section>
  );
}

function IngredientsSection({ activeId, onHover, onAdd, addedIds }) {
  return (
    <section className="sect sect-ingredients" data-focus="body" data-screen-label="05 Ingredients">
      <div className="sect-inner ingr-inner">
        <div className="ingr-meta mono">CLOSE-UP · INGREDIENTS</div>
        <h2 className="display ingr-title">Six absolutes,<br/>one accord.</h2>
        <p className="ingr-lede">
          Touch any part of the bottle. Each ingredient comes from a single source,
          then folded into one accord.
        </p>
        <div className="ingr-detail">
          {activeId ? (
            <ActiveIngredient ing={INGREDIENTS.find(i => i.id === activeId)}
                              onAdd={onAdd}
                              added={addedIds.includes(activeId)} />
          ) : (
            <div className="ingr-placeholder mono">
              ↗ Hover any spot on the bottle
            </div>
          )}
        </div>
        <div className="ingr-grid">
          {INGREDIENTS.map(ing => (
            <button key={ing.id}
              className={`ingr-chip ${activeId === ing.id ? 'is-active' : ''}`}
              onClick={() => onHover(activeId === ing.id ? null : ing.id)}>
              <span className="ingr-dot" style={{ background: ing.color }}></span>
              <span>{ing.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActiveIngredient({ ing, onAdd, added }) {
  if (!ing) return null;
  return (
    <div className="ingr-active">
      <div className="ingr-active-hd">
        <span className="ingr-dot lg" style={{ background: ing.color }}></span>
        <div>
          <div className="ingr-active-name">{ing.name}</div>
          <div className="mono ingr-active-origin">{ing.origin} · {ing.pct}</div>
        </div>
      </div>
      <button className={`add-mini ${added ? 'is-added' : ''}`} onClick={() => onAdd(ing)}>
        {added ? '✓ ADDED TO MEMO' : '+ ADD TO MEMO'}
      </button>
    </div>
  );
}

function RevealSection() {
  return (
    <section className="sect sect-reveal" data-focus="full" data-screen-label="06 Reveal">
      <div className="sect-inner reveal-inner">
        <div className="reveal-frame">
          <div className="reveal-corner tl"></div>
          <div className="reveal-corner tr"></div>
          <div className="reveal-corner bl"></div>
          <div className="reveal-corner br"></div>
          <div className="reveal-meta mono">N° 07 · ETERNAL BLOOM · 50ML</div>
          <h2 className="display reveal-title">
            <span className="ital">Et voilà.</span>
          </h2>
          <p className="reveal-tag">Composed in Grasse · 2026 ·<br/>Vegan · IFRA certified</p>
        </div>
      </div>
    </section>
  );
}

const SIZE_OPTIONS = [
  { id: '50ml',   label: '50ML',       price: 185 },
  { id: '100ml',  label: '100ML',      price: 265 },
  { id: 'travel', label: '10ML TRAVEL', price: 58 },
];

function BuySection({ onAdd, cartCount }) {
  const [selectedSize, setSelectedSize] = useState('50ml');
  const size = SIZE_OPTIONS.find(s => s.id === selectedSize) || SIZE_OPTIONS[0];

  return (
    <section className="sect sect-buy" data-focus="full" data-screen-label="06 Buy">
      <div className="sect-inner buy-inner">
        <div className="buy-meta mono">N° 07 · in stock</div>
        <h2 className="display buy-title">Eternal Bloom<br/><span className="ital">Eau de Parfum</span></h2>
        <div className="buy-row">
          <div className="buy-sizes">
            {SIZE_OPTIONS.map(s => (
              <button key={s.id}
                className={`size-pill ${selectedSize === s.id ? 'is-active' : ''}`}
                onClick={() => setSelectedSize(s.id)}>
                <span className="mono">{s.label}</span>
                <span className="size-price">${s.price}</span>
              </button>
            ))}
          </div>
          <button className="buy-cta" onClick={() => onAdd({
            id: `eternal-bloom-${size.id}`,
            name: 'Eternal Bloom',
            origin: `Eau de Parfum · ${size.label}`,
            color: '#d4a5a5',
            price: size.price,
          })}>
            <span>Add to bag</span>
            <span className="buy-cta-arrow">→</span>
          </button>
        </div>
        <div className="buy-strip">
          <div><span className="mono">FREE SHIPPING</span><span>orders over $120</span></div>
          <div><span className="mono">SAMPLES</span><span>three on every order</span></div>
          <div><span className="mono">RETURNS</span><span>thirty days, no questions</span></div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, {
  HeroSection, NoteSection, IngredientsSection, RevealSection, BuySection,
  INGREDIENTS, NOTE_DATA,
});
