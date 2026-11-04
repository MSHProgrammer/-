// High-fidelity comic / caricature illustrations matching the artistic style of IMG_3888_31064515.jpeg
// Features clean black ink line-art outlines, warm pastel/flat palette, and expressive caricature characters

function encodeSvg(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// 1. Stadium & Floodlights ("ملاعب") - matching card 1 in reference
export const COMIC_STADIUM_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#E8F1F5"/>
  <!-- Sky / background lines -->
  <path d="M 0 320 Q 200 290 400 320 L 400 500 L 0 500 Z" fill="#D3E4EC"/>
  <!-- Floodlight towers and stadium roof tents -->
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Tent Roof Ribs -->
    <path d="M 20 400 L 70 80 L 120 400" fill="#FFFFFF"/>
    <path d="M 120 400 L 170 90 L 220 400" fill="#F8FAFC"/>
    <path d="M 220 400 L 270 100 L 320 400" fill="#FFFFFF"/>
    <path d="M 320 400 L 360 120 L 395 400" fill="#F1F5F9"/>
    
    <!-- Tension cables -->
    <line x1="70" y1="80" x2="30" y2="420" stroke-width="4"/>
    <line x1="170" y1="90" x2="130" y2="420" stroke-width="4"/>
    <line x1="270" y1="100" x2="230" y2="420" stroke-width="4"/>
    
    <!-- Stadium structural beams -->
    <rect x="50" y="340" width="310" height="24" fill="#0F172A" rx="4"/>
    <line x1="60" y1="380" x2="350" y2="380" stroke-width="6"/>
    <line x1="70" y1="410" x2="340" y2="410" stroke-width="6"/>
    
    <!-- Spotlights -->
    <circle cx="70" cy="75" r="10" fill="#FACC15"/>
    <circle cx="170" cy="85" r="10" fill="#FACC15"/>
    <circle cx="270" cy="95" r="10" fill="#FACC15"/>
    <!-- Pitch green lawn glimpse -->
    <rect x="0" y="440" width="400" height="60" fill="#15803D" stroke="#0F172A" stroke-width="6"/>
    <line x1="100" y1="470" x2="300" y2="470" stroke="#FFFFFF" stroke-width="6"/>
  </g>
</svg>
`);

// 2. Board Games, Dice & Domino ("بورد جيمز وألعاب") - matching card 2 in reference
export const COMIC_GAMES_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#EDF4F9"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Green Puzzle Piece -->
    <path d="M 220 80 C 235 60 265 60 280 80 L 320 80 C 340 95 340 125 320 140 L 320 180 C 305 195 305 225 320 240 L 260 240 C 245 225 215 225 200 240 L 200 180 C 215 165 215 135 200 120 Z" fill="#86EFAC"/>
    
    <!-- White 3D Die (Top Left) -->
    <polygon points="80,100 160,80 210,130 130,150" fill="#FFFFFF"/>
    <polygon points="80,100 130,150 130,230 80,180" fill="#F1F5F9"/>
    <polygon points="130,150 210,130 210,210 130,230" fill="#E2E8F0"/>
    <!-- Die Dots -->
    <circle cx="145" cy="115" r="6" fill="#1E293B"/>
    <circle cx="105" cy="140" r="5" fill="#DC2626"/>
    <circle cx="105" cy="170" r="5" fill="#DC2626"/>
    <circle cx="170" cy="160" r="5" fill="#1E293B"/>
    <circle cx="170" cy="190" r="5" fill="#1E293B"/>

    <!-- Blue Game Pawn (Meeple/Figure) -->
    <circle cx="120" cy="300" r="28" fill="#38BDF8"/>
    <path d="M 100 328 Q 120 340 140 328 L 155 420 L 85 420 Z" fill="#0284C7"/>
    <ellipse cx="120" cy="420" rx="35" ry="12" fill="#0369A1"/>

    <!-- White Domino Tile (Right) -->
    <rect x="220" y="270" width="110" height="170" rx="16" fill="#FFFFFF" transform="rotate(18 275 355)"/>
    <line x1="210" y1="355" x2="340" y2="355" stroke-width="5" transform="rotate(18 275 355)"/>
    <circle cx="275" cy="315" r="8" fill="#1E293B" transform="rotate(18 275 355)"/>
    <circle cx="250" cy="395" r="7" fill="#1E293B" transform="rotate(18 275 355)"/>
    <circle cx="300" cy="395" r="7" fill="#1E293B" transform="rotate(18 275 355)"/>
    <circle cx="275" cy="425" r="7" fill="#1E293B" transform="rotate(18 275 355)"/>
  </g>
</svg>
`);

// 3. Traditional Man & Woman Heritage ("تراث وأمثال") - matching card 3 in reference
export const COMIC_HERITAGE_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#E1ECF4"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Woman in traditional dress (Left) -->
    <!-- Hair & Headpiece -->
    <path d="M 100 130 C 80 180 70 250 80 320 L 180 320 C 190 250 180 180 160 130 Z" fill="#1E1B4B"/>
    <circle cx="130" cy="170" r="38" fill="#FDDCB5"/>
    <path d="M 95 150 Q 130 130 165 150 C 160 190 100 190 95 150 Z" fill="#0F172A"/>
    <!-- Traditional Gold Head Band -->
    <path d="M 100 160 Q 130 175 160 160" stroke="#EAB308" stroke-width="8" fill="none"/>
    <!-- Woman Dress (Burgundy / Purple) -->
    <path d="M 75 310 L 50 490 L 200 490 L 185 310 Z" fill="#831843"/>
    <path d="M 100 310 L 130 390 L 160 310" stroke="#FACC15" stroke-width="8" fill="none"/>

    <!-- Man in Bisht (Right) -->
    <path d="M 230 150 C 230 110 320 110 320 150 L 320 230 L 230 230 Z" fill="#0F172A"/>
    <circle cx="275" cy="170" r="40" fill="#FCD34D"/>
    <!-- Ghutra / Headcover -->
    <path d="M 225 150 Q 275 120 325 150 L 335 250 L 215 250 Z" fill="#FFFFFF"/>
    <ellipse cx="275" cy="145" rx="36" ry="10" fill="#0F172A"/>
    <!-- Man Bisht / Thobe -->
    <path d="M 190 270 L 170 490 L 380 490 L 360 270 Z" fill="#991B1B"/>
    <!-- Gold Embroidered Edge (Zari) -->
    <path d="M 240 270 L 250 490" stroke="#FACC15" stroke-width="12" fill="none"/>
    <path d="M 310 270 L 300 490" stroke="#FACC15" stroke-width="12" fill="none"/>
  </g>
</svg>
`);

// 4. Gulf Actor with Ghutra & Clapperboard ("تلفزيون ومسلسلات") - matching card 4 in reference
export const COMIC_TV_ACTOR_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#DDE8F0"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Cinema Clapperboard (Top Left) -->
    <g transform="rotate(-15 110 130)">
      <rect x="40" y="80" width="150" height="40" fill="#0F172A"/>
      <path d="M 50 80 L 70 120 M 90 80 L 110 120 M 130 80 L 150 120 M 170 80 L 190 120" stroke="#FFFFFF" stroke-width="8"/>
      <rect x="40" y="120" width="150" height="80" fill="#FFFFFF"/>
      <line x1="55" y1="145" x2="175" y2="145" stroke="#0F172A" stroke-width="4"/>
      <line x1="55" y1="170" x2="140" y2="170" stroke="#0F172A" stroke-width="4"/>
    </g>

    <!-- Actor with Ghutra & Moustache -->
    <!-- Ghutra Fabric -->
    <path d="M 110 240 Q 200 130 290 240 L 320 420 L 80 420 Z" fill="#FFFFFF"/>
    <!-- Agal (Black Rings) -->
    <ellipse cx="200" cy="180" rx="60" ry="14" fill="#0F172A"/>
    <ellipse cx="200" cy="195" rx="58" ry="12" fill="#0F172A"/>
    
    <!-- Face Caricature -->
    <ellipse cx="200" cy="245" rx="52" ry="58" fill="#FBCFE8"/>
    <!-- Prominent Comic Moustache -->
    <path d="M 155 265 Q 200 245 200 270 Q 200 245 245 265 Q 220 295 155 265 Z" fill="#1E293B"/>
    <!-- Nose -->
    <path d="M 195 230 Q 210 245 195 255" fill="none" stroke-width="6"/>

    <!-- Black Thobe/Bisht shoulders -->
    <path d="M 90 350 L 50 495 L 350 495 L 310 350 Z" fill="#334155"/>
    <path d="M 170 350 L 200 420 L 230 350" stroke="#E2E8F0" stroke-width="6" fill="#FFFFFF"/>
  </g>
</svg>
`);

// 5. Football Fans Celebrating ("كورة وديربيات") - matching card 5 in reference
export const COMIC_FANS_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#E2EDF5"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Stadium board / crowd fence in background -->
    <rect x="60" y="80" width="280" height="180" fill="#FFFFFF" stroke-dasharray="16,8"/>
    <circle cx="200" cy="140" r="30" fill="#F87171" opacity="0.4"/>
    
    <!-- Fan 1 (Red Jersey / Number 7) - Left -->
    <circle cx="140" cy="270" r="35" fill="#FED7AA"/>
    <!-- Hair -->
    <path d="M 115 255 Q 140 230 165 255 Z" fill="#0F172A"/>
    <!-- Raised Right Arm -->
    <path d="M 125 330 L 100 220 L 130 200" stroke-width="18" stroke="#991B1B" fill="none"/>
    <!-- Torso (Red Jersey) -->
    <path d="M 105 320 L 85 495 L 210 495 L 185 320 Z" fill="#B91C1C"/>
    <!-- Number 7 -->
    <text x="145" y="420" font-family="sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" text-anchor="middle">7</text>

    <!-- Fan 2 (White & Sky Blue Stripes / Number 10) - Right -->
    <circle cx="270" cy="260" r="36" fill="#FDE047"/>
    <!-- Hair -->
    <path d="M 240 240 Q 275 220 300 240 Z" fill="#451A03"/>
    <!-- Raised Left Arm -->
    <path d="M 280 320 L 310 200 L 280 190" stroke-width="18" stroke="#0284C7" fill="none"/>
    <!-- Torso (Striped Jersey) -->
    <path d="M 215 310 L 195 495 L 340 495 L 315 310 Z" fill="#FFFFFF"/>
    <!-- Sky Blue Stripes -->
    <rect x="225" y="315" width="24" height="180" fill="#38BDF8"/>
    <rect x="270" y="315" width="24" height="180" fill="#38BDF8"/>
    <!-- Number 10 -->
    <text x="258" y="420" font-family="sans-serif" font-weight="900" font-size="46" fill="#0F172A" text-anchor="middle">10</text>
  </g>
</svg>
`);

// 6. Sin-Jeem Comic Typography ("سين جيم وأسئلة") - matching card 6 in reference
export const COMIC_SIN_JEEM_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#E6EEF5"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Big Comic Speech Bubble / Badge Background -->
    <path d="M 70 120 Q 200 60 330 110 Q 380 250 330 380 Q 200 450 70 390 Q 20 260 70 120 Z" fill="#7C3AED"/>
    
    <!-- White Inner Comic Bubble -->
    <path d="M 90 140 Q 200 90 310 130 Q 350 250 310 360 Q 200 420 90 370 Q 50 260 90 140 Z" fill="#FFFFFF"/>

    <!-- Comic "سين" Text in Bold 3D Style -->
    <!-- 3D Shadow -->
    <text x="204" y="234" font-family="'Alexandria', 'Arial Black', sans-serif" font-weight="900" font-size="88" fill="#4C1D95" text-anchor="middle">سِين</text>
    <!-- Foreground Text -->
    <text x="200" y="230" font-family="'Alexandria', 'Arial Black', sans-serif" font-weight="900" font-size="88" fill="#7C3AED" text-anchor="middle">سِين</text>

    <!-- Comic Red Badge for "جيم" -->
    <ellipse cx="200" cy="310" rx="90" ry="45" fill="#EF4444"/>
    <ellipse cx="204" cy="314" rx="86" ry="42" fill="#B91C1C" opacity="0.3"/>
    <text x="200" y="326" font-family="'Alexandria', 'Arial Black', sans-serif" font-weight="900" font-size="56" fill="#FFFFFF" text-anchor="middle">جِيم</text>

    <!-- Small sparkling stars -->
    <polygon points="60,90 65,105 80,105 68,115 72,130 60,120 48,130 52,115 40,105 55,105" fill="#FACC15"/>
    <polygon points="330,370 335,385 350,385 338,395 342,410 330,400 318,410 322,395 310,385 325,385" fill="#FACC15"/>
  </g>
</svg>
`);

// 7. Comic Gamer with Controller & Headset ("ألعاب الفيديو والجيمنج")
export const COMIC_GAMER_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#E8EDF4"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Big Gaming Headset -->
    <path d="M 120 180 Q 200 90 280 180" stroke="#0F172A" stroke-width="22" fill="none"/>
    <rect x="95" y="170" width="30" height="65" rx="14" fill="#3B82F6"/>
    <rect x="275" y="170" width="30" height="65" rx="14" fill="#3B82F6"/>
    <path d="M 105 235 L 145 260" stroke="#3B82F6" stroke-width="8" fill="none"/>
    <circle cx="150" cy="265" r="8" fill="#EF4444"/>

    <!-- Head & Face -->
    <circle cx="200" cy="210" r="60" fill="#FDE68A"/>
    <path d="M 145 185 Q 200 150 255 185 Z" fill="#451A03"/>
    <!-- Cool 8-bit Pixel Sunglasses -->
    <rect x="155" y="195" width="40" height="24" fill="#0F172A"/>
    <rect x="205" y="195" width="40" height="24" fill="#0F172A"/>
    <rect x="195" y="202" width="10" height="8" fill="#0F172A"/>
    <!-- Gamer Smile -->
    <path d="M 180 240 Q 200 255 220 240" stroke-width="6" fill="none"/>

    <!-- Gamer Hoodie -->
    <path d="M 110 320 L 70 495 L 330 495 L 290 320 Z" fill="#1E1B4B"/>

    <!-- Comic Gamepad held in hands -->
    <rect x="120" y="340" width="160" height="90" rx="36" fill="#6366F1"/>
    <!-- D-pad -->
    <path d="M 160 365 v 40 M 140 385 h 40" stroke="#FFFFFF" stroke-width="8"/>
    <!-- Action buttons -->
    <circle cx="235" cy="375" r="7" fill="#EF4444"/>
    <circle cx="250" cy="390" r="7" fill="#10B981"/>
    <circle cx="220" cy="390" r="7" fill="#F59E0B"/>
    <circle cx="235" cy="405" r="7" fill="#3B82F6"/>
  </g>
</svg>
`);

// 8. Anime & Spacetoon Caricature Hero ("أنمي وسبيستون")
export const COMIC_ANIME_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#FAF0E6"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Spiky Orange Anime Hair -->
    <polygon points="120,180 80,120 150,130 180,60 220,120 260,70 270,140 330,120 280,200" fill="#F97316"/>
    <!-- Anime Headband -->
    <rect x="120" y="165" width="160" height="34" rx="6" fill="#1E293B"/>
    <rect x="160" y="170" width="80" height="24" rx="4" fill="#94A3B8"/>
    <circle cx="200" cy="182" r="6" fill="#0F172A"/>

    <!-- Anime Face -->
    <path d="M 135 195 L 140 270 L 200 310 L 260 270 L 265 195 Z" fill="#FFEDD5"/>
    <!-- Expressive Anime Eyes -->
    <ellipse cx="165" cy="235" rx="16" ry="22" fill="#0284C7"/>
    <circle cx="169" cy="230" r="7" fill="#FFFFFF"/>
    <ellipse cx="235" cy="235" rx="16" ry="22" fill="#0284C7"/>
    <circle cx="239" cy="230" r="7" fill="#FFFFFF"/>
    <!-- Cheek marks -->
    <line x1="135" y1="260" x2="150" y2="260" stroke="#EA580C" stroke-width="4"/>
    <line x1="250" y1="260" x2="265" y2="260" stroke="#EA580C" stroke-width="4"/>

    <!-- Kimono / Orange Hero Jacket -->
    <path d="M 120 315 L 60 495 L 340 495 L 280 315 Z" fill="#EA580C"/>
    <path d="M 160 315 L 200 400 L 240 315" fill="#1E293B"/>
  </g>
</svg>
`);

// 9. Comic Detective / Riddles & Logic ("ألغاز وذكاء وتفكير")
export const COMIC_RIDDLES_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#EFF6FF"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Glowing Idea Lightbulb (Top Center) -->
    <path d="M 180 120 C 160 90 170 50 200 50 C 230 50 240 90 220 120 L 220 140 L 180 140 Z" fill="#FACC15"/>
    <rect x="185" y="140" width="30" height="15" fill="#94A3B8"/>
    <!-- Glow rays -->
    <line x1="200" y1="30" x2="200" y2="15" stroke="#EAB308" stroke-width="6"/>
    <line x1="150" y1="65" x2="135" y2="55" stroke="#EAB308" stroke-width="6"/>
    <line x1="250" y1="65" x2="265" y2="55" stroke="#EAB308" stroke-width="6"/>

    <!-- Detective Hat (Deerstalker) -->
    <path d="M 110 200 Q 200 130 290 200" stroke-width="12" fill="#78350F"/>
    <ellipse cx="200" cy="205" rx="100" ry="16" fill="#92400E"/>
    
    <!-- Face with One Big Eye through Magnifying Glass -->
    <circle cx="200" cy="260" r="50" fill="#FED7AA"/>
    
    <!-- Magnifying Glass (Right Eye) -->
    <circle cx="225" cy="255" r="38" fill="#BAE6FD" stroke="#0F172A" stroke-width="10"/>
    <circle cx="225" cy="255" r="22" fill="#0284C7"/>
    <circle cx="230" cy="250" r="9" fill="#FFFFFF"/>
    <!-- Handle -->
    <line x1="252" y1="282" x2="295" y2="340" stroke="#78350F" stroke-width="18"/>

    <!-- Detective Trench Coat -->
    <path d="M 110 340 L 70 495 L 330 495 L 290 340 Z" fill="#B45309"/>
    <path d="M 160 340 L 200 420 L 240 340" fill="#451A03"/>
    <!-- Giant Question Mark Floating -->
    <text x="90" y="300" font-family="'Alexandria', sans-serif" font-weight="900" font-size="70" fill="#DC2626">؟</text>
  </g>
</svg>
`);

// 10. Comic World Cup & Leagues ("كأس العالم والدوريات")
export const COMIC_WORLDCUP_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <rect width="400" height="500" fill="#FEF3C7"/>
  <g stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Golden World Cup Trophy -->
    <!-- Top Globe -->
    <circle cx="200" cy="150" r="55" fill="#F59E0B"/>
    <!-- Trophy Body Pillars (Two figures holding globe) -->
    <path d="M 165 190 Q 140 260 175 320 L 225 320 Q 260 260 235 190 Z" fill="#FBBF24"/>
    <path d="M 185 200 L 200 280 L 215 200" stroke="#D97706" stroke-width="8" fill="none"/>
    <!-- Trophy Base -->
    <rect x="145" y="320" width="110" height="35" rx="8" fill="#15803D"/>
    <rect x="135" y="355" width="130" height="40" rx="8" fill="#F59E0B"/>
    <line x1="145" y1="375" x2="255" y2="375" stroke="#B45309" stroke-width="6"/>

    <!-- Confetti & Celebration Stars -->
    <circle cx="90" cy="110" r="10" fill="#EF4444"/>
    <circle cx="310" cy="120" r="12" fill="#3B82F6"/>
    <circle cx="100" cy="240" r="8" fill="#10B981"/>
    <circle cx="300" cy="270" r="10" fill="#EC4899"/>
    <!-- Whistle -->
    <path d="M 80 380 Q 110 370 120 400 L 90 410 Z" fill="#94A3B8"/>
    <circle cx="85" cy="395" r="16" fill="#CBD5E1"/>
  </g>
</svg>
`);

export const COMIC_PRESETS = [
  { id: 'stadium', title: 'ملاعب واستادات', url: COMIC_STADIUM_SVG },
  { id: 'games', title: 'بورد جيمز وألعاب', url: COMIC_GAMES_SVG },
  { id: 'heritage', title: 'تراث وأمثال وشخصيات', url: COMIC_HERITAGE_SVG },
  { id: 'tv_actor', title: 'مسلسلات وتلفزيون', url: COMIC_TV_ACTOR_SVG },
  { id: 'fans', title: 'كورة وديربيات وجماهير', url: COMIC_FANS_SVG },
  { id: 'sin_jeem', title: 'سين جيم ومسابقات', url: COMIC_SIN_JEEM_SVG },
  { id: 'gamer', title: 'جيمنج وفيديو جيمز', url: COMIC_GAMER_SVG },
  { id: 'anime', title: 'أنمي وسبيستون', url: COMIC_ANIME_SVG },
  { id: 'riddles', title: 'ألغاز ومحققين', url: COMIC_RIDDLES_SVG },
  { id: 'worldcup', title: 'كؤوس وبطولات', url: COMIC_WORLDCUP_SVG },
];
