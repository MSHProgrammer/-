import React from 'react';

interface IllustrationProps {
  type?: string;
  topicTitle: string;
  className?: string;
}

export const JamrainIllustration: React.FC<IllustrationProps> = ({ type, topicTitle, className = 'w-full h-full' }) => {
  // 1. Lion / عالم الحيوان
  if (topicTitle.includes('حيوان') || type === 'lion') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldLion" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="darkMane" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>
        {/* Mane background */}
        <path d="M100 25 C65 25 40 55 42 95 C45 130 65 155 70 170 L130 170 C135 155 155 130 158 95 C160 55 135 25 100 25 Z" fill="url(#darkMane)" stroke="#1E1B4B" strokeWidth="4" />
        {/* Outer mane tufts */}
        <path d="M48 65 Q35 85 45 105 Q35 125 55 145" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        <path d="M152 65 Q165 85 155 105 Q165 125 145 145" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        {/* Lion Body & Legs */}
        <rect x="70" y="125" width="60" height="50" rx="12" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <rect x="74" y="135" width="22" height="40" rx="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        <rect x="104" y="135" width="22" height="40" rx="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        {/* Paws */}
        <circle cx="85" cy="172" r="9" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" />
        <circle cx="115" cy="172" r="9" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" />
        {/* Head */}
        <ellipse cx="100" cy="85" rx="35" ry="38" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        {/* Ears */}
        <circle cx="68" cy="55" r="14" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <circle cx="68" cy="55" r="7" fill="#F43F5E" />
        <circle cx="132" cy="55" r="14" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <circle cx="132" cy="55" r="7" fill="#F43F5E" />
        {/* Muzzle */}
        <ellipse cx="90" cy="98" rx="13" ry="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        <ellipse cx="110" cy="98" rx="13" ry="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        {/* Nose */}
        <path d="M93 88 L107 88 L100 97 Z" fill="#451A03" stroke="#1E1B4B" strokeWidth="2" />
        {/* Whiskers */}
        <path d="M75 97 L58 95 M75 102 L58 105" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
        <path d="M125 97 L142 95 M125 102 L142 105" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
        {/* Eyes */}
        <ellipse cx="86" cy="77" rx="5" ry="7" fill="#1E1B4B" />
        <ellipse cx="114" cy="77" rx="5" ry="7" fill="#1E1B4B" />
        <circle cx="88" cy="75" r="2" fill="#FFFFFF" />
        <circle cx="116" cy="75" r="2" fill="#FFFFFF" />
        {/* Tail */}
        <path d="M135 155 Q165 140 160 115" stroke="#CA8A04" strokeWidth="6" strokeLinecap="round" />
        <circle cx="160" cy="115" r="7" fill="#92400E" />
      </svg>
    );
  }

  // 2. Science / علوم
  if (topicTitle.includes('علوم') || topicTitle.includes('فيزياء') || type === 'science') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Open Book on left */}
        <g transform="translate(18, 30) scale(0.65)">
          <path d="M10 50 Q45 35 80 50 L80 110 Q45 95 10 110 Z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="4" />
          <path d="M80 50 Q115 35 150 50 L150 110 Q115 95 80 110 Z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="4" />
          <line x1="25" y1="65" x2="68" y2="65" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="78" x2="68" y2="78" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="91" x2="60" y2="91" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="92" y1="65" x2="135" y2="65" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="92" y1="78" x2="135" y2="78" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* Chemical Flask on right with bubbling yellow fluid */}
        <g transform="translate(132, 38) scale(0.7)">
          <path d="M25 15 L35 15 L35 40 L55 80 C58 87 52 95 44 95 L16 95 C8 95 2 87 5 80 L25 40 Z" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="4" strokeLinejoin="round" />
          <path d="M9 75 Q30 70 51 75 L55 80 C58 87 52 95 44 95 L16 95 C8 95 2 87 5 80 Z" fill="#FACC15" />
          <circle cx="25" cy="82" r="3" fill="#FFFFFF" opacity="0.8" />
          <circle cx="36" cy="78" r="2" fill="#FFFFFF" opacity="0.8" />
          <rect x="23" y="10" width="14" height="6" rx="2" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="3" />
        </g>
        {/* Einstein Head Cartoon in Center */}
        <g transform="translate(58, 68) scale(0.85)">
          {/* Crazy white hair */}
          <path d="M15 45 C5 25 10 5 35 10 C45 -5 65 -5 75 8 C95 2 105 20 95 45 C108 55 105 78 88 85 C92 98 75 105 65 95 C55 105 38 98 42 85 C22 82 10 65 15 45 Z" fill="#F1F5F9" stroke="#1E1B4B" strokeWidth="4" />
          {/* Face */}
          <ellipse cx="55" cy="55" rx="28" ry="30" fill="#FED7AA" stroke="#1E1B4B" strokeWidth="4" />
          {/* Bushy Brows */}
          <path d="M36 42 Q46 38 52 42" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          <path d="M58 42 Q64 38 74 42" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="44" cy="48" r="4" fill="#1E1B4B" />
          <circle cx="66" cy="48" r="4" fill="#1E1B4B" />
          {/* Nose */}
          <ellipse cx="55" cy="56" rx="5" ry="4" fill="#FDBA74" stroke="#1E1B4B" strokeWidth="2" />
          {/* Bushy white mustache */}
          <path d="M34 66 C42 63 52 64 55 68 C58 64 68 63 76 66 C70 72 60 72 55 69 C50 72 40 72 34 66 Z" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
          {/* Tongue sticking out! (Iconic Einstein) */}
          <path d="M50 70 C50 78 60 78 60 70 Z" fill="#FB7185" stroke="#1E1B4B" strokeWidth="3" />
          <line x1="55" y1="70" x2="55" y2="75" stroke="#BE123C" strokeWidth="2" />
        </g>
        {/* Compass & DNA strand */}
        <g transform="translate(28, 128) scale(0.7)">
          <path d="M25 10 L10 60 M25 10 L40 60" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="25" cy="10" r="5" fill="#E2E8F0" stroke="#1E1B4B" strokeWidth="3" />
          <line x1="14" y1="42" x2="36" y2="42" stroke="#64748B" strokeWidth="3" />
        </g>
        <g transform="translate(142, 122) scale(0.65)">
          <path d="M10 10 Q25 25 10 40 Q25 55 10 70" stroke="#06B6D4" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M25 10 Q10 25 25 40 Q10 55 25 70" stroke="#8B5CF6" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="12" y1="20" x2="23" y2="20" stroke="#1E1B4B" strokeWidth="3" />
          <line x1="15" y1="35" x2="20" y2="35" stroke="#1E1B4B" strokeWidth="3" />
          <line x1="12" y1="50" x2="23" y2="50" stroke="#1E1B4B" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 3. Snacks / مثلجات وتسالي
  if (topicTitle.includes('مثلجات') || topicTitle.includes('تسالي') || type === 'snacks') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Yellow Bag of Potato Chips on Left */}
        <g transform="translate(26, 32) scale(0.9)">
          {/* Chip Bag */}
          <path d="M15 15 L75 15 L70 120 L10 120 Z" fill="#FACC15" stroke="#1E1B4B" strokeWidth="4" strokeLinejoin="round" />
          {/* Bag crimp lines */}
          <path d="M15 15 L20 20 L25 15 L30 20 L35 15 L40 20 L45 15 L50 20 L55 15 L60 20 L65 15 L70 20 L75 15" stroke="#CA8A04" strokeWidth="2" />
          <path d="M10 120 L15 115 L20 120 L25 115 L30 120 L35 115 L40 120 L45 115 L50 120 L55 115 L60 120 L65 115 L70 120" stroke="#CA8A04" strokeWidth="2" />
          {/* Red/White Center Label */}
          <circle cx="43" cy="65" r="18" fill="#EF4444" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M27 65 Q43 55 59 65" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* Golden Potato Chips spilled */}
        <ellipse cx="60" cy="148" rx="12" ry="7" fill="#F59E0B" stroke="#1E1B4B" strokeWidth="3" transform="rotate(-15 60 148)" />
        <ellipse cx="78" cy="144" rx="13" ry="8" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" transform="rotate(20 78 144)" />
        {/* Soda Can on Right */}
        <g transform="translate(118, 48) scale(0.85)">
          {/* Can Cylinder */}
          <rect x="10" y="20" width="55" height="100" rx="12" fill="#2563EB" stroke="#1E1B4B" strokeWidth="4" />
          {/* Can top */}
          <ellipse cx="37" cy="20" rx="27" ry="10" fill="#CBD5E1" stroke="#1E1B4B" strokeWidth="4" />
          <ellipse cx="37" cy="20" rx="16" ry="6" fill="#94A3B8" />
          {/* Can bottom */}
          <ellipse cx="37" cy="120" rx="27" ry="10" fill="#1D4ED8" stroke="#1E1B4B" strokeWidth="4" />
          {/* Circular swirl label (Pepsi style) */}
          <circle cx="37" cy="70" r="18" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M22 66 C28 58 46 58 52 66 C46 72 28 72 22 66 Z" fill="#DC2626" />
          <path d="M22 74 C28 82 46 82 52 74 C46 68 28 68 22 74 Z" fill="#1D4ED8" />
        </g>
      </svg>
    );
  }

  // 4. Brain / معلومات عامة
  if (topicTitle.includes('معلومات') || topicTitle.includes('ذكاء') || type === 'brain') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow rays */}
        <path d="M100 15 L100 25 M45 40 L53 48 M155 40 L147 48 M25 95 L35 95 M175 95 L165 95" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
        {/* Glass Bulb Outline */}
        <path d="M65 125 C50 110 45 80 55 55 C68 25 132 25 145 55 C155 80 150 110 135 125 L130 145 L70 145 Z" fill="#FEF9C3" fillOpacity="0.4" stroke="#1E1B4B" strokeWidth="5" strokeLinejoin="round" />
        {/* Pink Brain Inside Bulb */}
        <g transform="translate(62, 45) scale(0.76)">
          <path d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C55 85 55 15 50 15 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="4" />
          <path d="M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C45 85 45 15 50 15 Z" fill="#FB7185" stroke="#BE185D" strokeWidth="4" />
          {/* Brain folds & gyri */}
          <path d="M28 35 Q40 40 32 55 Q42 65 30 72" stroke="#9D174D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M72 35 Q60 40 68 55 Q58 65 70 72" stroke="#9D174D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M48 25 Q50 45 48 75" stroke="#BE185D" strokeWidth="3" />
        </g>
        {/* Screw Base of Lightbulb */}
        <rect x="74" y="145" width="52" height="10" rx="3" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="4" />
        <rect x="78" y="155" width="44" height="9" rx="3" fill="#64748B" stroke="#1E1B4B" strokeWidth="4" />
        <rect x="84" y="164" width="32" height="8" rx="3" fill="#475569" stroke="#1E1B4B" strokeWidth="4" />
        <path d="M92 172 Q100 178 108 172 Z" fill="#1E1B4B" />
      </svg>
    );
  }

  // 5. World Cup Trophy / كأس العالم
  if (topicTitle.includes('كأس') || topicTitle.includes('عالم') || type === 'cup') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldTrophy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        {/* Base with Green Malachite bands */}
        <g transform="translate(68, 145)">
          <rect x="0" y="15" width="64" height="22" rx="4" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="4" />
          <rect x="6" y="20" width="52" height="4" fill="#047857" />
          <rect x="6" y="27" width="52" height="4" fill="#047857" />
          <path d="M6 15 L14 0 L50 0 L58 15 Z" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="3" />
        </g>
        {/* Two Human Figures Spiraling Upwards */}
        <g transform="translate(68, 65)">
          <path d="M14 80 Q20 50 16 30 Q12 10 24 5 Q28 20 32 45 Q36 65 50 80 Z" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M50 80 Q44 50 48 30 Q52 10 40 5 Q36 20 32 45 Q28 65 14 80 Z" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="3" />
          {/* Hands holding the globe */}
          <path d="M22 10 Q32 0 42 10" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* Globe at Top */}
        <circle cx="100" cy="50" r="28" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="4" />
        {/* Continents engraved */}
        <path d="M85 45 Q95 38 105 44 Q115 50 120 42" stroke="#B45309" strokeWidth="3" fill="none" />
        <path d="M90 55 Q100 62 112 56" stroke="#B45309" strokeWidth="3" fill="none" />
        {/* Sparkles */}
        <polygon points="135,30 138,38 146,41 138,44 135,52 132,44 124,41 132,38" fill="#FFFFFF" />
        <polygon points="65,40 67,45 72,47 67,49 65,54 63,49 58,47 63,45" fill="#FFFFFF" />
      </svg>
    );
  }

  // 6. Signpost / اختيارات
  if (topicTitle.includes('اختيار') || topicTitle.includes('ألغاز') || type === 'choices') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wooden Post */}
        <rect x="92" y="30" width="16" height="150" rx="3" fill="#B45309" stroke="#1E1B4B" strokeWidth="4" />
        {/* Wood grain */}
        <line x1="97" y1="40" x2="97" y2="170" stroke="#78350F" strokeWidth="2" strokeDasharray="8 4" />
        {/* Ground base */}
        <ellipse cx="100" cy="180" rx="40" ry="10" fill="#15803D" stroke="#1E1B4B" strokeWidth="3" />
        {/* Arrow 1: Option 1 (pointing right, orange) */}
        <g transform="translate(30, 45)">
          <path d="M10 0 L115 0 L130 13 L115 26 L10 26 Z" fill="#F97316" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="70" cy="13" r="3" fill="#1E1B4B" />
          <text x="65" y="17" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 1</text>
        </g>
        {/* Arrow 2: Option 2 (pointing left, teal/cyan) */}
        <g transform="translate(25, 78)">
          <path d="M15 0 L130 0 L130 26 L15 26 L0 13 Z" fill="#2DD4BF" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="75" cy="13" r="3" fill="#1E1B4B" />
          <text x="75" y="17" fill="#1E1B4B" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 2</text>
        </g>
        {/* Arrow 3: Option 3 (pointing right, pink/rose) */}
        <g transform="translate(35, 110)">
          <path d="M10 0 L110 0 L125 13 L110 26 L10 26 Z" fill="#FB7185" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="65" cy="13" r="3" fill="#1E1B4B" />
          <text x="65" y="17" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 3</text>
        </g>
        {/* Arrow 4: Option 4 (pointing left, yellow) */}
        <g transform="translate(30, 142)">
          <path d="M15 0 L125 0 L125 26 L15 26 L0 13 Z" fill="#FACC15" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="70" cy="13" r="3" fill="#1E1B4B" />
          <text x="70" y="17" fill="#1E1B4B" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 4</text>
        </g>
      </svg>
    );
  }

  // 7. General Fallback illustration
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="75" fill="#6366F1" stroke="#1E1B4B" strokeWidth="5" />
      <circle cx="100" cy="100" r="60" fill="#4338CA" />
      <polygon points="100,45 116,80 155,85 125,112 133,150 100,130 67,150 75,112 45,85 84,80" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="3" />
      <polygon points="100,60 111,85 138,89 118,108 123,135 100,121 77,135 82,108 62,89 89,85" fill="#FDE047" />
    </svg>
  );
};
