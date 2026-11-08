import React from 'react';

interface IllustrationProps {
  type?: string;
  topicTitle: string;
  icon?: string;
  className?: string;
}

export const JamrainIllustration: React.FC<IllustrationProps> = ({ 
  type, 
  topicTitle, 
  icon = '⭐',
  className = 'w-full h-full' 
}) => {
  const title = topicTitle.trim();

  // 1. Lion / عالم الحيوان
  if (title.includes('حيوان') || type === 'lion') {
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
        <path d="M100 25 C65 25 40 55 42 95 C45 130 65 155 70 170 L130 170 C135 155 155 130 158 95 C160 55 135 25 100 25 Z" fill="url(#darkMane)" stroke="#1E1B4B" strokeWidth="4" />
        <path d="M48 65 Q35 85 45 105 Q35 125 55 145" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        <path d="M152 65 Q165 85 155 105 Q165 125 145 145" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        <rect x="70" y="125" width="60" height="50" rx="12" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <rect x="74" y="135" width="22" height="40" rx="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        <rect x="104" y="135" width="22" height="40" rx="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        <circle cx="85" cy="172" r="9" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" />
        <circle cx="115" cy="172" r="9" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" />
        <ellipse cx="100" cy="85" rx="35" ry="38" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <circle cx="68" cy="55" r="14" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <circle cx="68" cy="55" r="7" fill="#F43F5E" />
        <circle cx="132" cy="55" r="14" fill="url(#goldLion)" stroke="#1E1B4B" strokeWidth="4" />
        <circle cx="132" cy="55" r="7" fill="#F43F5E" />
        <ellipse cx="90" cy="98" rx="13" ry="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        <ellipse cx="110" cy="98" rx="13" ry="10" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
        <path d="M93 88 L107 88 L100 97 Z" fill="#451A03" stroke="#1E1B4B" strokeWidth="2" />
        <path d="M75 97 L58 95 M75 102 L58 105" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
        <path d="M125 97 L142 95 M125 102 L142 105" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="86" cy="77" rx="5" ry="7" fill="#1E1B4B" />
        <ellipse cx="114" cy="77" rx="5" ry="7" fill="#1E1B4B" />
        <circle cx="88" cy="75" r="2" fill="#FFFFFF" />
        <circle cx="116" cy="75" r="2" fill="#FFFFFF" />
        <path d="M135 155 Q165 140 160 115" stroke="#CA8A04" strokeWidth="6" strokeLinecap="round" />
        <circle cx="160" cy="115" r="7" fill="#92400E" />
      </svg>
    );
  }

  // 2. Science / علوم
  if (title.includes('علوم') || title.includes('فيزياء') || type === 'science') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(18, 30) scale(0.65)">
          <path d="M10 50 Q45 35 80 50 L80 110 Q45 95 10 110 Z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="4" />
          <path d="M80 50 Q115 35 150 50 L150 110 Q115 95 80 110 Z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="4" />
          <line x1="25" y1="65" x2="68" y2="65" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="78" x2="68" y2="78" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="92" y1="65" x2="135" y2="65" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="92" y1="78" x2="135" y2="78" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g transform="translate(132, 38) scale(0.7)">
          <path d="M25 15 L35 15 L35 40 L55 80 C58 87 52 95 44 95 L16 95 C8 95 2 87 5 80 L25 40 Z" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="4" strokeLinejoin="round" />
          <path d="M9 75 Q30 70 51 75 L55 80 C58 87 52 95 44 95 L16 95 C8 95 2 87 5 80 Z" fill="#FACC15" />
          <circle cx="25" cy="82" r="3" fill="#FFFFFF" opacity="0.8" />
          <circle cx="36" cy="78" r="2" fill="#FFFFFF" opacity="0.8" />
          <rect x="23" y="10" width="14" height="6" rx="2" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="3" />
        </g>
        <g transform="translate(58, 68) scale(0.85)">
          <path d="M15 45 C5 25 10 5 35 10 C45 -5 65 -5 75 8 C95 2 105 20 95 45 C108 55 105 78 88 85 C92 98 75 105 65 95 C55 105 38 98 42 85 C22 82 10 65 15 45 Z" fill="#F1F5F9" stroke="#1E1B4B" strokeWidth="4" />
          <ellipse cx="55" cy="55" rx="28" ry="30" fill="#FED7AA" stroke="#1E1B4B" strokeWidth="4" />
          <circle cx="44" cy="48" r="4" fill="#1E1B4B" />
          <circle cx="66" cy="48" r="4" fill="#1E1B4B" />
          <ellipse cx="55" cy="56" rx="5" ry="4" fill="#FDBA74" stroke="#1E1B4B" strokeWidth="2" />
          <path d="M38 64 C45 60 65 60 72 64 C70 70 60 72 55 72 C50 72 40 70 38 64 Z" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M48 68 C48 76 62 76 62 68 Z" fill="#EF4444" stroke="#1E1B4B" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 3. Snacks / تسالي ومثلجات
  if (title.includes('تسالي') || title.includes('مثلجات') || title.includes('شيبس') || type === 'snacks') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(20, 30)">
          <path d="M15 25 L85 25 L95 140 L5 140 Z" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="4" strokeLinejoin="round" />
          <path d="M15 25 L10 20 L20 20 L25 25 L35 20 L40 25 L50 20 L55 25 L65 20 L70 25 L80 20 L85 25" stroke="#1E1B4B" strokeWidth="3" fill="#D97706" />
          <path d="M5 140 L0 145 L10 145 L15 140 L25 145 L30 140 L40 145 L45 140 L55 145 L60 140 L70 145 L75 140 L85 145 L90 140 L95 145" stroke="#1E1B4B" strokeWidth="3" fill="#D97706" />
          <circle cx="50" cy="80" r="24" fill="#DC2626" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M30 80 Q50 68 70 80" stroke="#FBBF24" strokeWidth="5" fill="none" />
          <ellipse cx="30" cy="145" rx="18" ry="12" fill="#F59E0B" stroke="#1E1B4B" strokeWidth="3" />
          <ellipse cx="65" cy="148" rx="16" ry="10" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" />
        </g>
        <g transform="translate(125, 45)">
          <rect x="0" y="10" width="50" height="115" rx="10" fill="#2563EB" stroke="#1E1B4B" strokeWidth="4" />
          <ellipse cx="25" cy="10" rx="25" ry="8" fill="#93C5FD" stroke="#1E1B4B" strokeWidth="3" />
          <ellipse cx="25" cy="125" rx="25" ry="8" fill="#1D4ED8" stroke="#1E1B4B" strokeWidth="3" />
          <circle cx="25" cy="65" r="18" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="2.5" />
          <path d="M7 65 Q25 48 43 65" fill="#DC2626" />
          <path d="M7 65 Q25 82 43 65" fill="#2563EB" />
        </g>
      </svg>
    );
  }

  // 4. Brain / معلومات عامة
  if (title.includes('معلومات') || title.includes('عامة') || type === 'brain') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bulbGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#FDE047" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M100 25 C60 25 50 65 52 95 C54 115 70 130 75 145 L125 145 C130 130 146 115 148 95 C150 65 140 25 100 25 Z" fill="url(#bulbGlow)" stroke="#1E1B4B" strokeWidth="5" />
        <g transform="translate(68, 55)">
          <path d="M32 8 C15 8 5 22 8 36 C5 45 10 55 20 58 C25 65 40 65 45 58 C52 65 60 55 58 45 C65 35 60 20 48 15 C45 8 38 8 32 8 Z" fill="#F472B6" stroke="#1E1B4B" strokeWidth="3.5" />
          <path d="M20 25 Q32 20 44 25" stroke="#BE185D" strokeWidth="2.5" fill="none" />
          <path d="M16 38 Q32 35 48 38" stroke="#BE185D" strokeWidth="2.5" fill="none" />
          <path d="M22 50 Q32 45 42 50" stroke="#BE185D" strokeWidth="2.5" fill="none" />
          <line x1="32" y1="12" x2="32" y2="58" stroke="#831843" strokeWidth="3" />
        </g>
        <rect x="76" y="145" width="48" height="8" rx="2" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="3" />
        <rect x="78" y="153" width="44" height="8" rx="2" fill="#64748B" stroke="#1E1B4B" strokeWidth="3" />
        <rect x="82" y="161" width="36" height="8" rx="2" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="3" />
        <path d="M92 169 Q100 178 108 169 Z" fill="#1E1B4B" />
      </svg>
    );
  }

  // 5. World Cup Trophy / كأس العالم
  if (title.includes('كأس') || title.includes('عالم') || type === 'cup') {
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
        <g transform="translate(68, 140)">
          <rect x="0" y="15" width="64" height="22" rx="4" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="4" />
          <rect x="6" y="20" width="52" height="4" fill="#047857" />
          <rect x="6" y="27" width="52" height="4" fill="#047857" />
          <path d="M6 15 L14 0 L50 0 L58 15 Z" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="3" />
        </g>
        <g transform="translate(68, 60)">
          <path d="M14 80 Q20 50 16 30 Q12 10 24 5 Q28 20 32 45 Q36 65 50 80 Z" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M50 80 Q44 50 48 30 Q52 10 40 5 Q36 20 32 45 Q28 65 14 80 Z" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M22 10 Q32 0 42 10" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="48" r="28" fill="url(#goldTrophy)" stroke="#1E1B4B" strokeWidth="4" />
        <path d="M85 43 Q95 36 105 42 Q115 48 120 40" stroke="#B45309" strokeWidth="3" fill="none" />
        <polygon points="135,28 138,36 146,39 138,42 135,50 132,42 124,39 132,36" fill="#FFFFFF" />
      </svg>
    );
  }

  // 6. Signpost / اختيارات
  if (title.includes('اختيار') || title.includes('ألغاز') || type === 'choices') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="92" y="30" width="16" height="150" rx="3" fill="#B45309" stroke="#1E1B4B" strokeWidth="4" />
        <ellipse cx="100" cy="180" rx="40" ry="10" fill="#15803D" stroke="#1E1B4B" strokeWidth="3" />
        <g transform="translate(30, 45)">
          <path d="M10 0 L115 0 L130 13 L115 26 L10 26 Z" fill="#F97316" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="70" cy="13" r="3" fill="#1E1B4B" />
          <text x="65" y="17" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 1</text>
        </g>
        <g transform="translate(25, 78)">
          <path d="M15 0 L130 0 L130 26 L15 26 L0 13 Z" fill="#2DD4BF" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="75" cy="13" r="3" fill="#1E1B4B" />
          <text x="75" y="17" fill="#1E1B4B" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 2</text>
        </g>
        <g transform="translate(35, 110)">
          <path d="M10 0 L110 0 L125 13 L110 26 L10 26 Z" fill="#FB7185" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="65" cy="13" r="3" fill="#1E1B4B" />
          <text x="65" y="17" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 3</text>
        </g>
        <g transform="translate(30, 142)">
          <path d="M15 0 L125 0 L125 26 L15 26 L0 13 Z" fill="#FACC15" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="70" cy="13" r="3" fill="#1E1B4B" />
          <text x="70" y="17" fill="#1E1B4B" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">OPTION 4</text>
        </g>
      </svg>
    );
  }

  // 7. Saudi Arabia / السعودية
  if (title.includes('سعودية') || title.includes('السعودية')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="saudiShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
        </defs>
        <path d="M100 20 C140 20 165 45 165 95 C165 145 125 175 100 185 C75 175 35 145 35 95 C35 45 60 20 100 20 Z" fill="url(#saudiShield)" stroke="#FEF08A" strokeWidth="5" />
        {/* Palm Tree */}
        <g transform="translate(85, 35)">
          <rect x="12" y="35" width="6" height="40" rx="3" fill="#CA8A04" stroke="#1E1B4B" strokeWidth="2" />
          <path d="M15 35 Q5 15 -15 25 Q0 10 15 35 Q30 10 45 25 Q25 15 15 35" fill="#22C55E" stroke="#1E1B4B" strokeWidth="2.5" />
          <path d="M15 35 Q10 0 15 -5 Q20 0 15 35" fill="#4ADE80" stroke="#1E1B4B" strokeWidth="2" />
        </g>
        {/* Crossed Scimitars / Swords */}
        <g transform="translate(48, 110)">
          <path d="M10 45 Q50 20 95 10 Q70 25 20 50 Z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M95 45 Q55 20 10 10 Q35 25 85 50 Z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="3" />
          <circle cx="15" cy="48" r="5" fill="#EAB308" />
          <circle cx="90" cy="48" r="5" fill="#EAB308" />
        </g>
      </svg>
    );
  }

  // 8. Kuwait / الكويت
  if (title.includes('كويت') || title.includes('الكويت')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyKuwait" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="75" fill="url(#skyKuwait)" stroke="#38BDF8" strokeWidth="5" />
        {/* Ocean Waves */}
        <path d="M28 135 Q60 120 100 135 Q140 150 172 135 L172 175 L28 175 Z" fill="#0284C7" />
        <path d="M35 145 Q65 135 100 145 Q135 155 165 145" stroke="#BAE6FD" strokeWidth="3" />
        {/* Main Kuwait Tower (2 Spheres + Spire) */}
        <g transform="translate(85, 30)">
          <line x1="15" y1="0" x2="15" y2="110" stroke="#047857" strokeWidth="5" strokeLinecap="round" />
          <circle cx="15" cy="40" r="16" fill="#065F46" stroke="#34D399" strokeWidth="3" />
          <circle cx="15" cy="75" r="11" fill="#065F46" stroke="#34D399" strokeWidth="2.5" />
        </g>
        {/* Secondary Kuwait Tower */}
        <g transform="translate(118, 55)">
          <line x1="8" y1="0" x2="8" y2="85" stroke="#047857" strokeWidth="4" />
          <circle cx="8" cy="35" r="12" fill="#065F46" stroke="#34D399" strokeWidth="2.5" />
        </g>
        {/* Dhow Boat */}
        <g transform="translate(45, 115)">
          <path d="M5 25 L45 25 L38 35 L12 35 Z" fill="#78350F" stroke="#1E1B4B" strokeWidth="2.5" />
          <polygon points="25,5 25,25 45,25" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 9. UAE / الإمارات
  if (title.includes('إمارات') || title.includes('الإمارات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#0F172A" stroke="#EAB308" strokeWidth="5" />
        {/* Burj Khalifa Spire Silhouette */}
        <path d="M100 22 L103 45 L106 70 L110 110 L115 150 L85 150 L90 110 L94 70 L97 45 Z" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="100" y1="18" x2="100" y2="150" stroke="#FFFFFF" strokeWidth="2" />
        {/* Golden Falcon Wings */}
        <g transform="translate(50, 70)">
          <path d="M10 30 Q25 0 50 15 Q75 0 90 30 Q50 35 10 30 Z" fill="#EAB308" stroke="#1E1B4B" strokeWidth="2.5" />
          <circle cx="50" cy="20" r="8" fill="#FDE047" stroke="#1E1B4B" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 10. Qatar / قطر
  if (title.includes('قطر')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#881337" stroke="#FFFFFF" strokeWidth="5" />
        {/* Pearl in Golden Oyster */}
        <g transform="translate(60, 70)">
          <ellipse cx="40" cy="55" rx="38" ry="18" fill="#FDE047" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M5 50 Q40 10 75 50" fill="#CA8A04" stroke="#1E1B4B" strokeWidth="3" />
          <circle cx="40" cy="46" r="14" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
          <circle cx="36" cy="42" r="4" fill="#E0F2FE" />
        </g>
      </svg>
    );
  }

  // 11. Bahrain / البحرين
  if (title.includes('بحرين') || title.includes('البحرين')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#DC2626" stroke="#FFFFFF" strokeWidth="5" />
        {/* Bab Al Bahrain Gateway */}
        <g transform="translate(55, 65)">
          <rect x="15" y="20" width="60" height="55" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M30 75 C30 50 60 50 60 75 Z" fill="#DC2626" stroke="#1E1B4B" strokeWidth="3" />
          <polygon points="10,20 45,0 80,20" fill="#F59E0B" stroke="#1E1B4B" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 12. Oman / سلطنة عمان
  if (title.includes('عمان') || title.includes('عُمان')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#15803D" stroke="#DC2626" strokeWidth="5" />
        {/* Omani Khanjar */}
        <g transform="translate(75, 45)">
          <path d="M25 15 L25 40 L45 80 L35 90 L10 55 L15 15 Z" fill="#E2E8F0" stroke="#1E1B4B" strokeWidth="3.5" />
          <rect x="15" y="5" width="20" height="15" rx="3" fill="#EAB308" stroke="#1E1B4B" strokeWidth="2.5" />
          <circle cx="25" cy="50" r="6" fill="#EAB308" />
        </g>
      </svg>
    );
  }

  // 13. Football / دوري / كورة
  if (title.includes('كورة') || title.includes('دوري') || title.includes('كرة القدم') || title.includes('ريال') || title.includes('برشلونة')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#047857" stroke="#FACC15" strokeWidth="5" />
        {/* Classic 32-panel Football */}
        <circle cx="100" cy="100" r="48" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="4" />
        {/* Center Pentagon */}
        <polygon points="100,82 115,93 109,111 91,111 85,93" fill="#1E1B4B" />
        {/* Outer connecting seams */}
        <line x1="100" y1="82" x2="100" y2="60" stroke="#1E1B4B" strokeWidth="3" />
        <line x1="115" y1="93" x2="135" y2="88" stroke="#1E1B4B" strokeWidth="3" />
        <line x1="109" y1="111" x2="125" y2="128" stroke="#1E1B4B" strokeWidth="3" />
        <line x1="91" y1="111" x2="75" y2="128" stroke="#1E1B4B" strokeWidth="3" />
        <line x1="85" y1="93" x2="65" y2="88" stroke="#1E1B4B" strokeWidth="3" />
      </svg>
    );
  }

  // 14. Gaming / بلايستيشن / ألعاب
  if (title.includes('ألعاب') || title.includes('بلايستيشن') || title.includes('جيمينج') || type === 'gamepad') {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#312E81" stroke="#818CF8" strokeWidth="5" />
        {/* Modern Game Controller */}
        <g transform="translate(45, 60)">
          <path d="M20 20 C35 15 75 15 90 20 C105 25 115 55 105 75 C95 90 75 80 65 65 C55 65 45 65 35 65 C25 80 5 90 -5 75 C-15 55 -5 25 20 20 Z" fill="#1E1B4B" stroke="#A855F7" strokeWidth="3.5" />
          {/* D-Pad */}
          <rect x="15" y="32" width="6" height="18" rx="2" fill="#38BDF8" />
          <rect x="9" y="38" width="18" height="6" rx="2" fill="#38BDF8" />
          {/* Action buttons */}
          <circle cx="85" cy="35" r="3.5" fill="#EF4444" />
          <circle cx="95" cy="42" r="3.5" fill="#22C55E" />
          <circle cx="75" cy="42" r="3.5" fill="#3B82F6" />
          <circle cx="85" cy="50" r="3.5" fill="#EAB308" />
          {/* Joysticks */}
          <circle cx="38" cy="52" r="8" fill="#4B5563" stroke="#9CA3AF" strokeWidth="2" />
          <circle cx="62" cy="52" r="8" fill="#4B5563" stroke="#9CA3AF" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 15. Cinema / أفلام / أنمي / سبيستون
  if (title.includes('أفلام') || title.includes('سينما') || title.includes('أنمي') || title.includes('سبيستون')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#831843" stroke="#F43F5E" strokeWidth="5" />
        {/* Clapperboard */}
        <g transform="translate(45, 55)">
          <rect x="0" y="25" width="110" height="70" rx="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
          <g transform="rotate(-12, 0, 25)">
            <rect x="0" y="0" width="110" height="25" rx="3" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <polygon points="15,0 30,0 20,25 5,25" fill="#FFFFFF" />
            <polygon points="45,0 60,0 50,25 35,25" fill="#FFFFFF" />
            <polygon points="75,0 90,0 80,25 65,25" fill="#FFFFFF" />
          </g>
          {/* Big Golden Star on Clapperboard */}
          <polygon points="55,42 62,56 77,58 66,69 69,84 55,76 41,84 44,69 33,58 48,56" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 16. Space / فضاء / كواكب
  if (title.includes('فضاء') || title.includes('كواكب') || title.includes('نجوم')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="75" fill="#030712" stroke="#6366F1" strokeWidth="5" />
        {/* Saturn Ring */}
        <g transform="translate(100, 100) rotate(-25)">
          <ellipse cx="0" cy="0" rx="65" ry="16" fill="none" stroke="#FACC15" strokeWidth="6" opacity="0.8" />
          <circle cx="0" cy="0" r="32" fill="#818CF8" stroke="#312E81" strokeWidth="3" />
        </g>
        {/* Rocket Ship */}
        <g transform="translate(50, 45) rotate(40)">
          <path d="M15 0 C25 15 25 35 15 50 L5 50 C-5 35 -5 15 5 0 Z" fill="#F8FAFC" stroke="#DC2626" strokeWidth="2" />
          <circle cx="10" cy="20" r="5" fill="#38BDF8" />
          <polygon points="10,50 15,65 10,60 5,65" fill="#F97316" />
        </g>
      </svg>
    );
  }

  // =========================================================================
  // UNIVERSAL DYNAMIC HERALDIC EMBLEM (Guarantees every topic has a unique icon!)
  // =========================================================================
  // Hash topic title to pick consistent, vibrant themes
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const colorSchemes = [
    { bg1: '#1E1B4B', bg2: '#4338CA', border: '#FACC15', glow: '#6366F1' },
    { bg1: '#064E3B', bg2: '#047857', border: '#34D399', glow: '#10B981' },
    { bg1: '#701A75', bg2: '#A21CAF', border: '#F472B6', glow: '#E879F9' },
    { bg1: '#7F1D1D', bg2: '#B91C1C', border: '#F87171', glow: '#EF4444' },
    { bg1: '#78350F', bg2: '#B45309', border: '#FDE047', glow: '#F59E0B' },
    { bg1: '#0F172A', bg2: '#1E293B', border: '#38BDF8', glow: '#0EA5E9' },
    { bg1: '#14532D', bg2: '#16A34A', border: '#FEF08A', glow: '#22C55E' },
    { bg1: '#4C1D95', bg2: '#6D28D9', border: '#C084FC', glow: '#8B5CF6' }
  ];
  const scheme = colorSchemes[Math.abs(hash) % colorSchemes.length];

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`grad_${Math.abs(hash)}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={scheme.bg1} />
          <stop offset="100%" stopColor={scheme.bg2} />
        </linearGradient>
      </defs>

      {/* Outer Golden Heraldic Shield */}
      <path 
        d="M100 20 C145 20 170 45 170 95 C170 145 130 175 100 185 C70 175 30 145 30 95 C30 45 55 20 100 20 Z" 
        fill={`url(#grad_${Math.abs(hash)})`} 
        stroke={scheme.border} 
        strokeWidth="6" 
      />

      {/* Decorative Starburst Rays */}
      <g opacity="0.25">
        <line x1="100" y1="30" x2="100" y2="170" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="35" y1="100" x2="165" y2="100" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="50" y1="50" x2="150" y2="150" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="150" y1="50" x2="50" y2="150" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" />
      </g>

      {/* Inner Central Sun Disc */}
      <circle cx="100" cy="98" r="42" fill="#000000" fillOpacity="0.35" stroke={scheme.glow} strokeWidth="3" />

      {/* Centered Large Unique Topic Symbol / Icon */}
      <text 
        x="100" 
        y="114" 
        fontSize="52" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
      >
        {icon}
      </text>

      {/* Top Victory Star */}
      <polygon points="100,26 103,34 111,36 105,42 107,50 100,46 93,50 95,42 89,36 97,34" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
    </svg>
  );
};
