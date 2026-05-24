// bottle.jsx — sculptural perfume bottle silhouettes
// Each silhouette renders the same coordinate system (viewBox 0 0 400 1100)
// so the camera transform in app.jsx can target consistent Y bands:
//   0–140      cap / stopper
//   140–230    neck + collar
//   230–360    shoulder
//   360–880    body
//   880–1080   base / foot
//   1080–1100  shadow band

const BOTTLE_BAND = {
  cap:      { center: 70,   range: [0, 140]    },
  neck:     { center: 195,  range: [140, 240]  },
  shoulder: { center: 290,  range: [240, 360]  },
  body:     { center: 600,  range: [360, 880]  },
  base:     { center: 980,  range: [880, 1080] },
};

// ─── Flower decoration for the cap ─────────────────────────────────
// Layered petals arranged radially. Used as the cap on the organic bottle
// (where the bloom IS the stopper) and as a smaller decoration on top of
// the other silhouettes.
// Single daisy: 5 rounded teardrop petals with gradient shading + polished
// gold ball center with rim shadow + specular highlights.
function Daisy({ cx, cy, r = 36, rot = 0, petalColor, petalShade }) {
  const petalPath = `
    M 0 0
    C ${-r * 0.32} ${-r * 0.10}  ${-r * 0.44} ${-r * 0.55}  ${-r * 0.30} ${-r * 0.95}
    C ${-r * 0.18} ${-r * 1.12}  ${-r * 0.06} ${-r * 1.20}  0 ${-r * 1.20}
    C ${ r * 0.06} ${-r * 1.20}  ${ r * 0.18} ${-r * 1.12}  ${ r * 0.30} ${-r * 0.95}
    C ${ r * 0.44} ${-r * 0.55}  ${ r * 0.32} ${-r * 0.10}  0 0  Z`;
  // unique gradient id per petal color (3 distinct daisies in use)
  const gradId = `petal-grad-${petalColor.replace('#', '')}`;
  const shadeId = `petal-shade-${petalColor.replace('#', '')}`;
  // build a lighter tint for the petal tip
  const lighten = (hex, amt = 0.35) => {
    const n = parseInt(hex.slice(1), 16);
    let r2 = (n >> 16) & 255, g2 = (n >> 8) & 255, b2 = n & 255;
    r2 = Math.min(255, Math.round(r2 + (255 - r2) * amt));
    g2 = Math.min(255, Math.round(g2 + (255 - g2) * amt));
    b2 = Math.min(255, Math.round(b2 + (255 - b2) * amt));
    return `rgb(${r2}, ${g2}, ${b2})`;
  };
  const petalTip = lighten(petalColor, 0.42);
  const petalBase = petalShade;
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 360 + rot;
    petals.push(
      <g key={i} transform={`translate(${cx} ${cy}) rotate(${a})`}>
        {/* cast shadow beneath petal */}
        <path d={petalPath}
          fill="rgba(0,0,0,0.18)"
          transform={`translate(${r * 0.04} ${r * 0.06})`}
          filter="blur(1.5px)" />
        {/* main petal with gradient */}
        <path d={petalPath} fill={`url(#${gradId})`}
          stroke={petalShade} strokeWidth="0.7" strokeOpacity="0.7" />
        {/* inner crease — soft midline darker stroke */}
        <path d={`M 0 ${-r * 0.05} L 0 ${-r * 1.1}`}
          stroke={petalShade} strokeWidth="0.5" strokeOpacity="0.35" fill="none" />
        {/* highlight along one edge */}
        <path d={`M ${-r * 0.16} ${-r * 0.55}
                  C ${-r * 0.12} ${-r * 0.85}  ${-r * 0.04} ${-r * 1.05}  0 ${-r * 1.12}`}
          stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  const gr = r * 0.36;
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={petalBase} />
          <stop offset="55%" stopColor={petalColor} />
          <stop offset="100%" stopColor={petalTip} />
        </linearGradient>
      </defs>
      {petals}
      {/* shadow ring under gold ball */}
      <circle cx={cx} cy={cy + gr * 0.18} r={gr * 1.05}
        fill="rgba(0,0,0,0.22)" filter="blur(2px)" />
      {/* gold ball — base */}
      <circle cx={cx} cy={cy} r={gr} fill="#a87618" />
      {/* gold ball — gradient overlay */}
      <circle cx={cx} cy={cy} r={gr} fill="url(#daisy-gold-grad)" />
      {/* rim darken (bottom) */}
      <circle cx={cx} cy={cy} r={gr}
        fill="none" stroke="rgba(60,40,10,0.6)" strokeWidth={gr * 0.06} />
      {/* primary specular */}
      <ellipse cx={cx - gr * 0.32} cy={cy - gr * 0.36}
        rx={gr * 0.38} ry={gr * 0.22} fill="rgba(255,255,255,0.95)" />
      {/* secondary specular */}
      <ellipse cx={cx + gr * 0.28} cy={cy + gr * 0.32}
        rx={gr * 0.16} ry={gr * 0.09} fill="rgba(255,255,255,0.5)" />
      {/* tiny pinhole highlight */}
      <circle cx={cx - gr * 0.42} cy={cy - gr * 0.44}
        r={gr * 0.08} fill="rgba(255,255,255,1)" />
    </g>
  );
}

// Daisy-style bouquet cap. cy is the visual center of the bouquet.
// Lowest petals reach ~ cy + r*1.2, so position cy so they overlap the bottle lip.
function CapFlower({ cx = 200, cy = 240, scale = 1 }) {
  const k = scale;
  const peach = '#bcd4ee', peachShade = '#7a9ec4';   // pastel blue
  const white = '#f4c2d2', whiteShade = '#c97a96';   // pastel pink
  const yellow = '#d4bfe6', yellowShade = '#9579b8'; // pastel lilac
  return (
    <g className="cap-flower">
      <defs>
        <radialGradient id="daisy-gold-grad" cx="0.3" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#fce69a" />
          <stop offset="55%" stopColor="#d4a23a" />
          <stop offset="100%" stopColor="#7a5618" />
        </radialGradient>
      </defs>
      {/* back-left — blue */}
      <Daisy cx={cx - 80 * k} cy={cy + 10 * k} r={70 * k} rot={18}
             petalColor={peach} petalShade={peachShade} />
      {/* hero — pink */}
      <Daisy cx={cx + 14 * k} cy={cy - 52 * k} r={92 * k} rot={6}
             petalColor={white} petalShade={whiteShade} />
      {/* front-right — lilac */}
      <Daisy cx={cx + 78 * k} cy={cy + 44 * k} r={78 * k} rot={-14}
             petalColor={yellow} petalShade={yellowShade} />
    </g>
  );
}

// Sculptural — organic curves with a flat foot so the bottle stands.
function OrganicBottle({ liquidColor, liquidLevel = 0.78, glassTone, capTone, glow }) {
  const bodyPath = `
    M 122 458
    Q 110 458 110 470
    L 110 880
    Q 110 902 132 902
    L 268 902
    Q 290 902 290 880
    L 290 470
    Q 290 458 278 458
    Z
  `;
  const bodyPathMirror = bodyPath; // single shape now

  return (
    <g>
      {/* ─── Defs ─────────────────────────────────────────── */}
      <defs>
        <clipPath id="liquid-clip-organic">
          <path d={bodyPath} />
        </clipPath>
        {/* horizontal gradient on glass: dark edge → light core → dark edge */}
        <linearGradient id="glass-x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(120,40,70,0.42)" />
          <stop offset="14%"  stopColor="rgba(255,210,220,0.10)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.04)" />
          <stop offset="86%"  stopColor="rgba(255,210,220,0.12)" />
          <stop offset="100%" stopColor="rgba(120,40,70,0.50)" />
        </linearGradient>
        {/* vertical gradient — slightly darker at top + bottom of glass */}
        <linearGradient id="glass-y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(70,20,40,0.22)" />
          <stop offset="20%"  stopColor="rgba(255,255,255,0)" />
          <stop offset="80%"  stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(70,20,40,0.30)" />
        </linearGradient>
        {/* liquid — darker base, brighter surface */}
        <linearGradient id="liquid-grad-organic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={liquidColor} stopOpacity="0.55" />
          <stop offset="20%"  stopColor={liquidColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={liquidColor} stopOpacity="1" />
        </linearGradient>
        {/* liquid horizontal — darker edges (refraction) */}
        <linearGradient id="liquid-x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(100,30,60,0.5)" />
          <stop offset="20%"  stopColor="rgba(255,255,255,0)" />
          <stop offset="80%"  stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(100,30,60,0.5)" />
        </linearGradient>
        {/* gold cap — cylindrical horizontal reflection */}
        <linearGradient id="gold-cap-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#5a3a08" />
          <stop offset="10%"  stopColor="#a87618" />
          <stop offset="22%"  stopColor="#fce69a" />
          <stop offset="38%"  stopColor="#d4a23a" />
          <stop offset="50%"  stopColor="#8a5a18" />
          <stop offset="62%"  stopColor="#d4a23a" />
          <stop offset="78%"  stopColor="#fce69a" />
          <stop offset="90%"  stopColor="#a87618" />
          <stop offset="100%" stopColor="#5a3a08" />
        </linearGradient>
        {/* gold cap vertical — top edge bright, bottom shadowed */}
        <linearGradient id="gold-cap-v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,235,160,0.6)" />
          <stop offset="20%"  stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(60,30,5,0.55)" />
        </linearGradient>
      </defs>

      {/* ─── Soft ground shadow (cast on surface) ─────────── */}
      <ellipse cx="200" cy="920" rx="140" ry="14" fill="rgba(0,0,0,0.28)" filter="blur(8px)" />
      <ellipse cx="200" cy="916" rx="90" ry="7"  fill="rgba(0,0,0,0.35)" filter="blur(3px)" />

      {/* ─── Halo behind glass (soft pink atmosphere) ─────── */}
      <ellipse cx="200" cy="660" rx="170" ry="240" fill={liquidColor} opacity="0.10" filter="blur(40px)" />

      {/* ─── Glass body ──────────────────────────────────── */}
      {/* base fill (clear tint) */}
      <path d={bodyPath} fill={glassTone} />
      {/* vertical refraction shading */}
      <path d={bodyPath} fill="url(#glass-y)" />

      {/* ─── Liquid (clipped to body) ─────────────────────── */}
      <g clipPath="url(#liquid-clip-organic)">
        <rect x="0" y={458 + (902 - 458) * (1 - liquidLevel)}
          width="400" height="500" fill="url(#liquid-grad-organic)" />
        {/* edge refraction on liquid */}
        <rect x="0" y={458 + (902 - 458) * (1 - liquidLevel)}
          width="400" height="500" fill="url(#liquid-x)" />
        {/* meniscus line at liquid surface */}
        <line x1="110" y1={458 + (902 - 458) * (1 - liquidLevel) + 1}
              x2="290" y2={458 + (902 - 458) * (1 - liquidLevel) + 1}
              stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <line x1="110" y1={458 + (902 - 458) * (1 - liquidLevel) + 3}
              x2="290" y2={458 + (902 - 458) * (1 - liquidLevel) + 3}
              stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
      </g>

      {/* ─── Glass thickness + edge refraction on top of liquid ── */}
      <path d={bodyPath} fill="url(#glass-x)" />

      {/* ─── Inner shadow ring (suggests glass thickness) ── */}
      <path d={bodyPath} fill="none"
        stroke="rgba(60,20,40,0.35)" strokeWidth="2" />
      <path d={bodyPath} fill="none"
        stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="0" />

      {/* ─── Specular highlights ──────────────────────────── */}
      {/* major vertical streak (left front face) */}
      <rect x="124" y="478" width="9" height="400" rx="4.5"
        fill="rgba(255,255,255,0.78)" />
      <rect x="124" y="478" width="9" height="400" rx="4.5"
        fill="url(#glass-y)" opacity="0.6" />
      {/* secondary thin streak */}
      <rect x="140" y="495" width="2.5" height="370" rx="1.2"
        fill="rgba(255,255,255,0.55)" />
      {/* right-side rim highlight */}
      <rect x="270" y="490" width="4" height="370" rx="2"
        fill="rgba(255,255,255,0.4)" />
      <rect x="278" y="500" width="2" height="350" rx="1"
        fill="rgba(255,255,255,0.28)" />
      {/* top arc highlight (where light catches the shoulder) */}
      <path d="M 130 462 Q 200 454 270 462"
        stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* base meniscus glow */}
      <rect x="120" y="876" width="160" height="4" rx="2"
        fill="rgba(255,255,255,0.55)" />
      <ellipse cx="200" cy="898" rx="80" ry="3" fill="rgba(255,255,255,0.35)" />

      {/* ─── Engraved label ──────────────────────────────── */}
      <g>
        {/* drop shadow under text to suggest engraving */}
        <text x="201" y="619" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="22" fill="rgba(0,0,0,0.25)" letterSpacing="2">
          ETERNAL
        </text>
        <text x="200" y="618" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="22" fill="#a04868" letterSpacing="2">
          ETERNAL
        </text>
        <text x="201" y="647" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="22" fill="rgba(0,0,0,0.25)" letterSpacing="2">
          BLOOM
        </text>
        <text x="200" y="646" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="22" fill="#a04868" letterSpacing="2">
          BLOOM
        </text>
        <line x1="155" y1="666" x2="245" y2="666"
          stroke="#a04868" strokeWidth="0.5" opacity="0.5" />
        <text x="200" y="684" textAnchor="middle"
          fontFamily="Outfit, sans-serif" fontSize="6" fill="#a04868" letterSpacing="2">
          ELIXIRS · GRASSE
        </text>
        <text x="200" y="800" textAnchor="middle"
          fontFamily="Outfit, sans-serif" fontSize="6.5" fill="#a04868" letterSpacing="3">
          EAU DE PARFUM
        </text>
      </g>

      {/* ─── Gold cap ─────────────────────────────────────── */}
      {/* shadow under cap on top of bottle shoulder */}
      <ellipse cx="200" cy="460" rx="58" ry="5" fill="rgba(0,0,0,0.25)" filter="blur(2px)" />
      {/* cap body */}
      <rect x="148" y="398" width="104" height="60" rx="5" fill="url(#gold-cap-h)" />
      <rect x="148" y="398" width="104" height="60" rx="5" fill="url(#gold-cap-v)" />
      {/* horizontal ridges */}
      <line x1="152" y1="412" x2="248" y2="412" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
      <line x1="152" y1="414" x2="248" y2="414" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
      <line x1="152" y1="444" x2="248" y2="444" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
      <line x1="152" y1="446" x2="248" y2="446" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
      {/* cap top edge bevel */}
      <rect x="148" y="398" width="104" height="3" rx="1.5" fill="rgba(255,255,255,0.7)" />
      {/* lip ring */}
      <rect x="156" y="386" width="88" height="16" rx="3" fill="url(#gold-cap-h)" />
      <rect x="156" y="386" width="88" height="16" rx="3" fill="url(#gold-cap-v)" />
      <rect x="156" y="386" width="88" height="2" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="156" y="400" width="88" height="2" rx="1" fill="rgba(0,0,0,0.3)" />

      {/* ─── Daisy bouquet ───────────────────────────────── */}
      <CapFlower cx={200} cy={340} scale={0.95} />
    </g>
  );
}

// Faceted — geometric crystal facets
function FacetedBottle({ liquidColor, liquidLevel = 0.78, glassTone, capTone, glow }) {
  const points = "200,140 280,200 320,360 320,820 280,980 200,1060 120,980 80,820 80,360 120,200";
  return (
    <g>
      <ellipse cx="200" cy="1075" rx="125" ry="9" fill="rgba(0,0,0,0.18)" filter="blur(2px)" />

      {/* main body */}
      <polygon points={points} fill={glassTone} opacity="0.92" />

      {/* facet lines */}
      <line x1="200" y1="140" x2="200" y2="1060" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
      <line x1="80" y1="360" x2="320" y2="360" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
      <line x1="80" y1="820" x2="320" y2="820" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
      <line x1="120" y1="200" x2="280" y2="980" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      <line x1="280" y1="200" x2="120" y2="980" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />

      <defs>
        <clipPath id="liquid-clip-faceted">
          <polygon points={points} />
        </clipPath>
      </defs>
      <g clipPath="url(#liquid-clip-faceted)">
        <rect x="0" y={140 + (1060 - 140) * (1 - liquidLevel)} width="400" height="1100" fill={liquidColor} opacity="0.85" />
      </g>

      {/* facet highlights */}
      <polygon points="200,140 280,200 200,360" fill="rgba(255,255,255,0.25)" />
      <polygon points="80,360 120,200 200,360 200,820 120,980" fill="rgba(255,255,255,0.08)" />

      {/* cap — angular */}
      <polygon points="200,40 250,80 250,140 150,140 150,80" fill={capTone} />
      <polygon points="200,40 250,80 200,100 150,80" fill="rgba(255,255,255,0.3)" />
      {/* small flower decoration on top of cap */}
      <CapFlower cx={200} cy={50} scale={0.55}
                 accent="#8b3a3a" soft="#e8b8b8" capTone={capTone} />

      {/* label */}
      <text x="200" y="640" textAnchor="middle"
        fontFamily="Playfair Display, serif" fontSize="22"
        fill="rgba(42,26,26,0.55)" letterSpacing="3">
        ETERNAL BLOOM
      </text>

      {glow && <polygon points={points} fill={liquidColor} opacity="0.08" filter="blur(40px)" />}
    </g>
  );
}

// Cylinder — tall slim minimalist
function CylinderBottle({ liquidColor, liquidLevel = 0.78, glassTone, capTone, glow }) {
  return (
    <g>
      <ellipse cx="200" cy="1085" rx="100" ry="8" fill="rgba(0,0,0,0.18)" filter="blur(2px)" />

      {/* body */}
      <rect x="120" y="180" width="160" height="900" rx="14" fill={glassTone} opacity="0.92" />

      <defs>
        <clipPath id="liquid-clip-cyl">
          <rect x="120" y="180" width="160" height="900" rx="14" />
        </clipPath>
      </defs>
      <g clipPath="url(#liquid-clip-cyl)">
        <rect x="120" y={180 + 900 * (1 - liquidLevel)} width="160" height="900" fill={liquidColor} opacity="0.9" />
      </g>

      {/* highlights */}
      <rect x="132" y="200" width="6" height="860" rx="3" fill="rgba(255,255,255,0.5)" />
      <rect x="262" y="220" width="3" height="700" rx="1.5" fill="rgba(255,255,255,0.3)" />

      {/* neck */}
      <rect x="174" y="140" width="52" height="44" fill={glassTone} opacity="0.92" />

      {/* cap */}
      <rect x="160" y="40" width="80" height="104" rx="6" fill={capTone} />
      <rect x="168" y="54" width="14" height="80" rx="3" fill="rgba(255,255,255,0.35)" />
      {/* small flower decoration sitting on top of cap */}
      <CapFlower cx={200} cy={42} scale={0.55}
                 accent="#8b3a3a" soft="#e8b8b8" capTone={capTone} />

      {/* label */}
      <line x1="120" y1="580" x2="280" y2="580" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
      <line x1="120" y1="720" x2="280" y2="720" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
      <text x="200" y="630" textAnchor="middle"
        fontFamily="Playfair Display, serif" fontSize="22"
        fill="rgba(42,26,26,0.6)" letterSpacing="3">
        ETERNAL
      </text>
      <text x="200" y="665" textAnchor="middle"
        fontFamily="Playfair Display, serif" fontSize="22"
        fill="rgba(42,26,26,0.6)" letterSpacing="3">
        BLOOM
      </text>
      <text x="200" y="700" textAnchor="middle"
        fontFamily="Outfit, sans-serif" fontSize="7"
        fill="rgba(42,26,26,0.5)" letterSpacing="2">
        EAU DE PARFUM
      </text>

      {glow && <rect x="120" y="180" width="160" height="900" rx="14" fill={liquidColor} opacity="0.08" filter="blur(40px)" />}
    </g>
  );
}

// Apothecary — classical chemist bottle
function ApothecaryBottle({ liquidColor, liquidLevel = 0.78, glassTone, capTone, glow }) {
  const bodyPath = `
    M 130 280
    Q 130 240 170 240
    L 230 240
    Q 270 240 270 280
    L 270 1000
    Q 270 1060 220 1060
    L 180 1060
    Q 130 1060 130 1000
    Z
  `;
  return (
    <g>
      <ellipse cx="200" cy="1075" rx="110" ry="9" fill="rgba(0,0,0,0.18)" filter="blur(2px)" />

      <path d={bodyPath} fill={glassTone} opacity="0.92" />

      <defs>
        <clipPath id="liquid-clip-apoth">
          <path d={bodyPath} />
        </clipPath>
      </defs>
      <g clipPath="url(#liquid-clip-apoth)">
        <rect x="0" y={240 + 820 * (1 - liquidLevel)} width="400" height="900" fill={liquidColor} opacity="0.9" />
      </g>

      <rect x="142" y="260" width="8" height="780" rx="4" fill="rgba(255,255,255,0.45)" />

      {/* neck */}
      <rect x="172" y="180" width="56" height="62" fill={glassTone} opacity="0.92" />
      <rect x="166" y="170" width="68" height="14" rx="3" fill={glassTone} />

      {/* cap — wide flat with bulb top */}
      <rect x="156" y="110" width="88" height="68" rx="6" fill={capTone} />
      {/* flower bloom replacing the simple bulb */}
      <CapFlower cx={200} cy={74} scale={0.7}
                 accent="#8b3a3a" soft="#e8b8b8" capTone={capTone} />

      {/* label — paper rectangle */}
      <rect x="142" y="500" width="116" height="220" fill="rgba(255,248,243,0.92)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      <text x="200" y="560" textAnchor="middle"
        fontFamily="Outfit, sans-serif" fontSize="9"
        fill="rgba(42,26,26,0.7)" letterSpacing="2">
        ELIXIRS
      </text>
      <line x1="160" y1="580" x2="240" y2="580" stroke="rgba(42,26,26,0.4)" strokeWidth="0.5" />
      <text x="200" y="630" textAnchor="middle"
        fontFamily="Playfair Display, serif" fontSize="20"
        fill="rgba(42,26,26,0.85)" letterSpacing="2">
        ETERNAL
      </text>
      <text x="200" y="660" textAnchor="middle"
        fontFamily="Playfair Display, serif" fontSize="20"
        fill="rgba(42,26,26,0.85)" letterSpacing="2">
        BLOOM
      </text>
      <text x="200" y="700" textAnchor="middle"
        fontFamily="Outfit, sans-serif" fontSize="7"
        fill="rgba(42,26,26,0.55)" letterSpacing="2">
        N° 07 · 50ML
      </text>

      {glow && <path d={bodyPath} fill={liquidColor} opacity="0.08" filter="blur(40px)" />}
    </g>
  );
}

const BOTTLE_VARIANTS = {
  organic: OrganicBottle,
  faceted: FacetedBottle,
  cylinder: CylinderBottle,
  apothecary: ApothecaryBottle,
};

function Bottle({ variant = 'organic', liquidColor = '#d4a5a5', liquidLevel = 0.78,
                  glassTone = 'rgba(255, 240, 235, 0.55)', capTone = '#2a1a1a',
                  glow = true, assemble = 0, rotate = 0 }) {
  const Variant = BOTTLE_VARIANTS[variant] || OrganicBottle;
  return (
    <svg viewBox="0 0 400 1100" preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', overflow: 'visible',
               transform: `rotateY(${rotate}deg)`, transformStyle: 'preserve-3d' }}>
      <g style={{ opacity: assemble }}>
        <Variant liquidColor={liquidColor} liquidLevel={liquidLevel}
                 glassTone={glassTone} capTone={capTone} glow={glow} />
      </g>
    </svg>
  );
}

Object.assign(window, { Bottle, BOTTLE_BAND, BOTTLE_VARIANTS });
