// app.jsx — main scroll-driven app
// Layout:
//   - Vertical scroll container with N sections (each ~100vh)
//   - One sticky bottle stage on the right side, viewport height
//   - Each section has data-focus={cap|neck|shoulder|body|base|full}
//     We compute scroll progress per section and lerp the SVG pan/zoom between bands
//   - At the final section ("reveal"), camera pulls back to scale 1 / focus 'full'

const { useEffect, useState, useRef, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "dolce",
  "bottle": "organic",
  "parallax": 1.0,
  "liquidColor": "#f3b8c4",
  "revealStyle": "pullback"
}/*EDITMODE-END*/;

const PALETTES = {
  rose: {
    bg: '#fdf2f3',           // pale blush
    paper: '#f9e2e6',        // dusty rose paper
    ink: '#4a1d2c',          // deep wine
    dim: '#8a5e6a',          // muted mauve
    rule: 'rgba(74,29,44,0.18)',
    accent: '#b54a6a',       // rose
    soft: '#f3c6cf',         // soft pink
    glassTone: 'rgba(255, 220, 226, 0.55)',
    capTone: '#d4a23a',
  },
  noir: {
    bg: '#15110f',
    paper: '#1f1916',
    ink: '#f5ece4',
    dim: '#a89a90',
    rule: 'rgba(245,236,228,0.18)',
    accent: '#c9a96a',
    soft: '#7a5a3a',
    glassTone: 'rgba(120, 90, 70, 0.55)',
    capTone: '#c9a96a',
  },
  bone: {
    bg: '#efe9df',
    paper: '#f5f0e6',
    ink: '#1a1a1a',
    dim: '#7a7068',
    rule: 'rgba(26,26,26,0.18)',
    accent: '#5a3825',
    soft: '#c4a890',
    glassTone: 'rgba(180, 160, 140, 0.32)',
    capTone: '#1a1a1a',
  },
  alabaster: {
    bg: '#f4f0eb',
    paper: '#fbf8f3',
    ink: '#23201c',
    dim: '#6e6862',
    rule: 'rgba(35,32,28,0.14)',
    accent: '#6b4a3a',
    soft: '#d8c4b0',
    glassTone: 'rgba(220, 200, 180, 0.38)',
    capTone: '#23201c',
  },
  dolce: {
    bg: '#fdf0f4',
    paper: '#fce5ed',
    ink: '#7c1a3a',
    dim: '#bf6888',
    rule: 'rgba(124,26,58,0.12)',
    accent: '#d4385e',
    soft: '#c9a8d8',
    glassTone: 'rgba(255, 185, 215, 0.55)',
    capTone: '#7c1a3a',
  },
};


// camera bands in bottle viewBox Y units (0..1100).
// Each band sets which Y of the bottle should sit at viewport center, plus zoom.
// 'capNeck'  — hero shot: the floral cap + neck framed top-of-frame
// 'shoulder' — top notes
// 'body'     — heart notes
// 'base'     — base notes
// 'full'     — ingredients + buy: whole bottle reveal
const BANDS = {
  capNeck:  { y: 360,  zoom: 1.5 },  // hero — bouquet + cap centered
  cap:      { y: 360,  zoom: 1.6 },
  shoulder: { y: 480,  zoom: 2.0 },  // top notes — collar + shoulders
  body:     { y: 660,  zoom: 1.9 },  // heart notes — mid label
  base:     { y: 880,  zoom: 2.1 },  // base notes — foot
  full:     { y: 600,  zoom: 0.95 },  // full reveal
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// easing
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const raw = useRef({ x: -200, y: -200 });
  const trail = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const move = (e) => { raw.current.x = e.clientX; raw.current.y = e.clientY; };
    const over = (e) => {
      const hov = !!e.target.closest('button, a');
      ringRef.current?.classList.toggle('hov', hov);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    document.body.classList.add('has-cursor');

    let raf;
    const tick = () => {
      trail.current.x += (raw.current.x - trail.current.x) * 0.13;
      trail.current.y += (raw.current.y - trail.current.y) * 0.13;
      if (dotRef.current) {
        dotRef.current.style.left = raw.current.x + 'px';
        dotRef.current.style.top  = raw.current.y + 'px';
      }
      if (ringRef.current) {
        ringRef.current.style.left = trail.current.x + 'px';
        ringRef.current.style.top  = trail.current.y + 'px';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      document.body.classList.remove('has-cursor');
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = PALETTES[t.palette] || PALETTES.rose;

  // scroll progress (0..1 across whole page)
  const [progress, setProgress] = useState(0);
  // current focus (smoothed) — tuple of {y, zoom}
  const [camera, setCamera] = useState({ y: 70, zoom: 2.6 });
  const [revealAmt, setRevealAmt] = useState(0); // 0..1 reveal progress on reveal section
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [memoIds, setMemoIds] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const scrollerRef = useRef(null);
  const sectionsRef = useRef([]);
  const cartTimerRef = useRef(null);

  // recompute camera on scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const sections = sectionsRef.current.filter(Boolean);
      if (!sections.length) return;
      const vh = window.innerHeight;
      const scrollY = el.scrollTop;
      const total = el.scrollHeight - vh;
      setProgress(clamp01(scrollY / Math.max(1, total)));

      // find which section is centered & how far through it we are
      let activeIdx = 0;
      let activeT = 0;
      sections.forEach((s, i) => {
        const top = s.offsetTop;
        const h = s.offsetHeight;
        const localT = (scrollY + vh / 2 - top) / h;
        if (localT >= 0 && localT < 1) {
          activeIdx = i;
          activeT = localT;
        } else if (localT >= 1) {
          activeIdx = i;
          activeT = 1;
        }
      });

      // determine source/target bands by interpolating between
      // current section's focus and next section's focus
      const cur = sections[activeIdx];
      const nxt = sections[Math.min(sections.length - 1, activeIdx + 1)];
      const focusOf = (el) => el?.querySelector?.('[data-focus]')?.dataset.focus
                            || el?.firstElementChild?.dataset?.focus
                            || el?.dataset?.focus
                            || 'full';
      const curFocus = focusOf(cur);
      const nxtFocus = focusOf(nxt);
      const a = BANDS[curFocus] || BANDS.full;
      const b = BANDS[nxtFocus] || a;

      // ease the transition — use second half of section to drift toward next
      const tWeight = easeInOut(activeT);
      const parallax = t.parallax || 1;
      const camY = lerp(a.y, b.y, tWeight);
      const camZ = lerp(a.zoom, b.zoom, tWeight);

      // apply parallax intensity (1.0 = full motion; <1 = damped; >1 = exaggerated)
      // damping pulls toward the "full" band
      const blend = (raw, neutral) => lerp(neutral, raw, parallax);
      setCamera({
        y: blend(camY, BANDS.full.y),
        zoom: blend(camZ, 1.2),
      });

      // reveal progress: only active during the reveal section
      const revealSection = sections.find(s => s?.classList.contains('sect-reveal'));
      if (revealSection) {
        const top = revealSection.offsetTop;
        const h = revealSection.offsetHeight;
        const r = clamp01((scrollY - (top - vh * 0.6)) / (h * 0.9));
        setRevealAmt(r);
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [t.parallax]);

  // mouse-tilt on the bottle stage — direct DOM, no React state
  useEffect(() => {
    const raw = { nx: 0, ny: 0 };
    const smooth = { nx: 0, ny: 0 };
    const move = (e) => {
      raw.nx = (e.clientX / window.innerWidth)  * 2 - 1;
      raw.ny = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', move);
    let raf;
    const tick = () => {
      smooth.nx += (raw.nx - smooth.nx) * 0.045;
      smooth.ny += (raw.ny - smooth.ny) * 0.045;
      const stage = document.querySelector('.bottle-stage-inner');
      if (stage) {
        stage.style.transform =
          `rotateY(${smooth.nx * 7}deg) rotateX(${smooth.ny * -4}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  // smooth-scroll the custom scroller to a section by index
  const scrollTo = useCallback((idx) => {
    const el = sectionsRef.current[idx];
    if (el && scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  }, []);

  // register section refs
  const setSectionRef = (i) => (el) => { sectionsRef.current[i] = el; };

  // cart helpers
  const addToCart = useCallback((item) => {
    setCart(c => {
      const found = c.find(x => x.id === item.id);
      if (found) return c.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { ...item, qty: 1 }];
    });
    setCartOpen(true);
    clearTimeout(cartTimerRef.current);
    cartTimerRef.current = setTimeout(() => setCartOpen(false), 2400);
  }, []);

  const addToMemo = useCallback((ing) => {
    setMemoIds(ids => ids.includes(ing.id) ? ids : [...ids, ing.id]);
  }, []);

  // reveal styling — different visual treatments
  const revealStyle = useMemo(() => {
    const r = revealAmt;
    // r is only nonzero inside the reveal section; outside, all reveal-styles
    // must collapse to identity so they don't deform the rest of the page.
    if (t.revealStyle === 'assemble') {
      // bottle fades in from translucent during reveal; full opacity elsewhere
      return { assemble: r > 0 ? lerp(0.15, 1, r) : 1, rotate: 0, extraScale: 1 };
    }
    if (t.revealStyle === 'pour') {
      // liquid fills only during reveal; default-full elsewhere
      return { assemble: 1, rotate: 0, extraScale: 1,
               liquidLevel: r > 0 ? lerp(0, 0.78, r) : 0.78 };
    }
    if (t.revealStyle === 'rotate') {
      return { assemble: 1, rotate: r > 0 ? lerp(-30, 0, r) : 0, extraScale: 1 };
    }
    // pullback (default) — bottle gently scales out during reveal only
    return { assemble: 1, rotate: 0, extraScale: r > 0 ? lerp(1.2, 1, r) : 1 };
  }, [revealAmt, t.revealStyle]);

  // hotspot positions in bottle stage coords (% of stage)
  const hotspots = INGREDIENTS;

  return (
    <div className="app" style={{
      '--bg': palette.bg, '--paper': palette.paper, '--ink': palette.ink,
      '--dim': palette.dim, '--rule': palette.rule, '--accent': palette.accent,
      '--soft': palette.soft,
      '--font-display': '"Playfair Display", serif',
      '--font-body': '"Outfit", sans-serif',
    }}>
      <CustomCursor />
      <Grain />
      <Header progress={progress} cartCount={cart.length}
              onCartClick={() => setCartOpen(o => !o)}
              onNavClick={scrollTo} />

      {/* sticky bottle stage */}
      <div className="bottle-stage">
        <div className="bottle-stage-inner">
          <BottleStage camera={camera} revealStyle={revealStyle}
                       palette={palette} variant={t.bottle}
                       liquidColor={t.liquidColor}
                       hotspots={hotspots}
                       activeIngredient={activeIngredient}
                       onHotspotEnter={setActiveIngredient}
                       onHotspotLeave={() => {}}
                       showHotspots={progress > 0.48 && progress < 0.88} />
        </div>
      </div>

      {/* scrolling content */}
      <div className="scroller" ref={scrollerRef}>
        <div ref={setSectionRef(0)}><HeroSection /></div>
        <div ref={setSectionRef(1)}><NoteSection kind="top" idx={0} /></div>
        <div ref={setSectionRef(2)}><NoteSection kind="heart" idx={1} /></div>
        <div ref={setSectionRef(3)}><NoteSection kind="base" idx={2} /></div>
        <div ref={setSectionRef(4)}>
          <IngredientsSection activeId={activeIngredient}
                              onHover={setActiveIngredient}
                              onAdd={addToMemo}
                              addedIds={memoIds} />
        </div>
        <div ref={setSectionRef(5)}>
          <BuySection onAdd={addToCart} cartCount={cart.length} />
        </div>
        <div ref={setSectionRef(6)}><RevealSection /></div>
        <FooterLine />
      </div>

      <CartDrawer open={cartOpen} cart={cart} onClose={() => setCartOpen(false)}
                  onRemove={(id) => setCart(c => c.filter(x => x.id !== id))} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakRadio value={t.palette}
          options={[
            { value: 'dolce', label: 'Dolce' },
            { value: 'rose', label: 'Rose' },
            { value: 'noir', label: 'Noir' },
            { value: 'alabaster', label: 'Alabaster' },
          ]}
          onChange={v => setTweak('palette', v)} />

        <TweakSection label="Bottle silhouette" />
        <TweakRadio value={t.bottle}
          options={[
            { value: 'organic',    label: 'Organic' },
            { value: 'faceted',    label: 'Faceted' },
            { value: 'cylinder',   label: 'Cylinder' },
            { value: 'apothecary', label: 'Apothecary' },
          ]}
          onChange={v => setTweak('bottle', v)} />

        <TweakSection label="Liquid color" />
        <TweakColor value={t.liquidColor}
          options={['#d4a5a5', '#c9a96a', '#9eb5d4', '#8b3a3a', '#e8b8b8', '#5a3825']}
          onChange={v => setTweak('liquidColor', v)} />

        <TweakSection label="Reveal style" />
        <TweakSelect value={t.revealStyle}
          options={[
            { value: 'pullback', label: 'Pull back from close-up' },
            { value: 'assemble', label: 'Fade in / assemble' },
            { value: 'pour',     label: 'Liquid pours in' },
            { value: 'rotate',   label: 'Rotate into view' },
          ]}
          onChange={v => setTweak('revealStyle', v)} />

        <TweakSection label="Scroll" />
        <TweakSlider label="Parallax intensity" value={t.parallax}
          min={0.3} max={1.6} step={0.05}
          onChange={v => setTweak('parallax', v)} />

      </TweaksPanel>
    </div>
  );
}

function Header({ progress, cartCount, onCartClick, onNavClick }) {
  return (
    <header className="hd">
      <div className="hd-l mono">ELIXIRS</div>
      <nav className="hd-c mono">
        <a href="#" onClick={e => { e.preventDefault(); onNavClick(0); }}>Fragrance</a>
        <a href="#" onClick={e => { e.preventDefault(); onNavClick(1); }}>Notes</a>
        <a href="#" onClick={e => { e.preventDefault(); onNavClick(4); }}>Ingredients</a>
        <a href="#" onClick={e => { e.preventDefault(); onNavClick(5); }}>Buy</a>
      </nav>
      <div className="hd-r">
        <span className="mono progress-pct">{String(Math.round(progress * 100)).padStart(2, '0')}%</span>
        <button className="cart-btn mono" onClick={onCartClick}>
          BAG <span className="cart-num">{cartCount}</span>
        </button>
      </div>
      <div className="hd-progress">
        <div className="hd-progress-bar" style={{ width: `${progress * 100}%` }}></div>
      </div>
    </header>
  );
}

function BottleStage({ camera, revealStyle, palette, variant, liquidColor,
                       hotspots, activeIngredient, onHotspotEnter, onHotspotLeave,
                       showHotspots }) {
  // The bottle SVG has viewBox 0 0 400 1100. We render it inside a fixed
  // 400×1100 inner box, centered, and apply CSS transform:
  //   translate camera.y → top of bottle to viewport center
  //   scale camera.zoom
  const stageStyle = {
    transform: `translate(-50%, -50%) translateY(${(550 - camera.y) * camera.zoom * 0.0}px) scale(${camera.zoom * (revealStyle.extraScale || 1)})`,
  };
  // Better: position the bottle so that the focused Y is centered in stage
  // Render bottle at fixed 400×1100. Center stage at (50%, 50%). To put
  // bottle Y=camera.y at viewport center, shift bottle by (550 - camera.y)
  // in viewBox units, then scale the whole thing by camera.zoom.
  const inner = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '400px',
    height: '1100px',
    marginLeft: '-200px',
    marginTop: '-550px',
    transform: `scale(${camera.zoom * (revealStyle.extraScale || 1)}) translateY(${(550 - camera.y)}px) rotateY(${revealStyle.rotate || 0}deg)`,
    transformOrigin: '50% 50%',
    transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
    transformStyle: 'preserve-3d',
  };

  return (
    <div className="bottle-3d">
      <div style={inner}>
        <Bottle variant={variant}
                liquidColor={liquidColor}
                liquidLevel={revealStyle.liquidLevel ?? 0.78}
                glassTone={palette.glassTone}
                capTone={palette.capTone}
                glow={true}
                assemble={revealStyle.assemble ?? 1}
                rotate={0} />
      </div>

      {/* hotspots — positioned in bottle viewBox space, transformed alongside */}
      {showHotspots && (
        <div className="hotspots" style={{
          ...inner,
          pointerEvents: 'none',
        }}>
          {hotspots.map(h => {
            const px = (h.x / 100) * 400;
            const py = (h.y / 100) * 1100;
            const isActive = activeIngredient === h.id;
            return (
              <button key={h.id}
                aria-label={h.name}
                className={`hotspot ${isActive ? 'is-active' : ''}`}
                style={{
                  position: 'absolute',
                  left: px, top: py,
                  pointerEvents: 'auto',
                }}
                onMouseEnter={() => onHotspotEnter(h.id)}
                onMouseLeave={() => onHotspotLeave()}
                onFocus={() => onHotspotEnter(h.id)}
                onBlur={() => onHotspotLeave()}>
                <span className="hotspot-dot" style={{ background: h.color }}></span>
                <span className="hotspot-pulse"></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BottleScrubber({ camera }) {
  // mini vertical indicator showing what part of the bottle is in view
  const ranges = [
    { key: 'cap',      label: 'Cap',      y: 70   },
    { key: 'neck',     label: 'Neck',     y: 195  },
    { key: 'shoulder', label: 'Shoulder', y: 290  },
    { key: 'body',     label: 'Body',     y: 600  },
    { key: 'base',     label: 'Base',     y: 980  },
  ];
  // closest band
  const closest = ranges.reduce((best, r) =>
    Math.abs(r.y - camera.y) < Math.abs(best.y - camera.y) ? r : best, ranges[0]);
  return (
    <div className="scrubber">
      <div className="scrubber-track">
        <div className="scrubber-thumb" style={{
          top: `${(camera.y / 1100) * 100}%`,
        }}></div>
      </div>
      <div className="scrubber-labels">
        {ranges.map(r => (
          <div key={r.key}
            className={`scrubber-label mono ${closest.key === r.key ? 'is-active' : ''}`}
            style={{ top: `${(r.y / 1100) * 100}%` }}>
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CartDrawer({ open, cart, onClose, onRemove }) {
  const total = cart.reduce((s, x) => s + (x.price || 0) * x.qty, 0);
  return (
    <>
      <div className={`drawer-scrim ${open ? 'is-open' : ''}`} onClick={onClose}></div>
      <aside className={`drawer ${open ? 'is-open' : ''}`}>
        <div className="drawer-hd">
          <span className="mono">YOUR BAG · {cart.length}</span>
          <button className="drawer-x" aria-label="Close bag" onClick={onClose}>×</button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="drawer-empty mono">nothing here yet</div>
          ) : cart.map(item => (
            <div key={item.id} className="drawer-row">
              <span className="drawer-dot" style={{ background: item.color }}></span>
              <div className="drawer-info">
                <div className="drawer-name">{item.name}</div>
                <div className="drawer-sub mono">{item.origin} · ×{item.qty}</div>
              </div>
              <div className="drawer-price mono">${(item.price || 0) * item.qty}</div>
              <button className="drawer-rm mono" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)}>×</button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-tot">
              <span className="mono">TOTAL</span>
              <span className="display drawer-total-amt">${total}</span>
            </div>
            <button className="drawer-cta">Checkout →</button>
          </div>
        )}
      </aside>
    </>
  );
}

function FooterLine() {
  return (
    <footer className="ftr">
      <div className="ftr-row">
        <span className="display ftr-mark ital">Elixirs</span>
        <span className="mono">N° 07 · ETERNAL BLOOM · MMXXVI</span>
      </div>
      <div className="ftr-row mono small">
        <span>© 2026 Elixirs Maison · Grasse, France</span>
        <span>hello@elixirs.fr</span>
      </div>
    </footer>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
