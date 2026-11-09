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
  const title = (topicTitle || '').trim().toLowerCase();

  // Helper background rect for consistent comic style
  const bg = <rect width="200" height="200" fill="#DDF0F9" rx="16" />;

  // 1. الكويت (Kuwait Towers + 100 Fils Coin)
  if (title.includes('كويت')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(10, 85)">
          <circle cx="45" cy="45" r="42" fill="#E2E8F0" stroke="#0F172A" strokeWidth="4" />
          <circle cx="45" cy="45" r="34" fill="#CBD5E1" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="45" cy="45" r="26" fill="#F1F5F9" stroke="#0F172A" strokeWidth="2.5" />
          <text x="45" y="44" fontSize="18" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">١٠٠</text>
          <text x="45" y="58" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">فلس</text>
        </g>
        <g transform="translate(135, 10)">
          <line x1="25" y1="0" x2="25" y2="185" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
          <path d="M15 185 L20 75 L30 75 L35 185 Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="25" cy="50" r="16" fill="#60A5FA" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="23" cy="47" r="12" fill="#38BDF8" />
          <ellipse cx="20" cy="44" rx="5" ry="2.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="25" cy="98" r="28" fill="#38BDF8" stroke="#0F172A" strokeWidth="4" />
          <circle cx="22" cy="95" r="23" fill="#0284C7" />
          <path d="M-3 98 Q25 82 53 98 Q25 114 -3 98" fill="#38BDF8" opacity="0.6" />
          <ellipse cx="18" cy="88" rx="8" ry="4" fill="#FFFFFF" opacity="0.8" />
        </g>
        <g transform="translate(98, 40)">
          <line x1="20" y1="0" x2="20" y2="155" stroke="#0F172A" strokeWidth="4" />
          <path d="M12 155 L16 65 L24 65 L28 155 Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
          <circle cx="20" cy="65" r="20" fill="#60A5FA" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="17" cy="62" r="16" fill="#0284C7" />
          <ellipse cx="15" cy="57" rx="5" ry="2.5" fill="#FFFFFF" opacity="0.8" />
        </g>
      </svg>
    );
  }

  // 2. السعودية (Crossed Swords + Palm Tree + Falcon)
  if (title.includes('سعودي') || title.includes('رياض') || title.includes('جدة') || title.includes('درعية') || title.includes('روشن')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(100, 25)">
          <path d="M-10 65 L-6 115 L6 115 L10 65 Z" fill="#92400E" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M0 65 C-30 30 -75 40 -80 70 C-55 60 -25 62 0 65" fill="#15803D" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M0 65 C30 30 75 40 80 70 C55 60 25 62 0 65" fill="#15803D" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M0 65 C-20 10 -55 10 -60 38 C-40 30 -12 45 0 65" fill="#16A34A" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M0 65 C20 10 55 10 60 38 C40 30 12 45 0 65" fill="#16A34A" stroke="#0F172A" strokeWidth="3.5" />
        </g>
        <g transform="translate(100, 145)">
          <path d="M-75 -35 C-35 0 15 18 65 22 L68 16 C20 8 -28 -5 -70 -40 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="-78" y="-40" width="10" height="22" rx="3" fill="#FACC15" stroke="#0F172A" strokeWidth="2.5" transform="rotate(35 -78 -40)" />
          <path d="M75 -35 C35 0 -15 18 -65 22 L-68 16 C-20 8 28 -5 70 -40 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="78" y="-40" width="10" height="22" rx="3" fill="#FACC15" stroke="#0F172A" strokeWidth="2.5" transform="rotate(-35 78 -40)" />
        </g>
      </svg>
    );
  }

  // 3. كرة قدم عالمية + كأس العالم + الأندية (Ronaldo 7 & Messi 10 + Net)
  if (title.includes('كرة قدم') || title.includes('كأس العالم') || title.includes('دوري أبطال') || title.includes('أندية') || title.includes('كلاسيكو') || title.includes('ريال') || title.includes('برشلونة') || title.includes('ميسي') || title.includes('رونالدو')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g opacity="0.35" stroke="#0F172A" strokeWidth="1.5">
          <line x1="20" y1="15" x2="180" y2="15" strokeWidth="4" />
          <line x1="20" y1="15" x2="20" y2="130" strokeWidth="4" />
          <line x1="180" y1="15" x2="180" y2="130" strokeWidth="4" />
          <line x1="50" y1="15" x2="50" y2="120" />
          <line x1="80" y1="15" x2="80" y2="120" />
          <line x1="110" y1="15" x2="110" y2="120" />
          <line x1="140" y1="15" x2="140" y2="120" />
          <line x1="20" y1="45" x2="180" y2="45" />
          <line x1="20" y1="80" x2="180" y2="80" />
        </g>
        <g transform="translate(15, 35)">
          <ellipse cx="50" cy="22" rx="16" ry="17" fill="#1E293B" />
          <rect x="42" y="32" width="16" height="12" fill="#FED7AA" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M15 44 L40 40 L60 40 L85 44 L90 130 L10 130 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M40 40 Q50 48 60 40" stroke="#15803D" strokeWidth="5" fill="none" />
          <text x="50" y="92" fontSize="36" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5">7</text>
          <text x="50" y="58" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">RONALDO</text>
        </g>
        <g transform="translate(95, 30)">
          <ellipse cx="55" cy="24" rx="16" ry="17" fill="#451A03" />
          <rect x="47" y="34" width="16" height="12" fill="#FED7AA" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M20 46 L45 42 L65 42 L90 46 L95 135 L15 135 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="32" y="44" width="12" height="91" fill="#38BDF8" />
          <rect x="56" y="44" width="12" height="91" fill="#38BDF8" />
          <rect x="78" y="46" width="10" height="89" fill="#38BDF8" />
          <text x="55" y="96" fontSize="34" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">10</text>
          <text x="55" y="60" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">MESSI</text>
        </g>
      </svg>
    );
  }

  // 4. الدوري الإنجليزي (Premier League Lion & Crown)
  if (title.includes('إنجليزي') || title.includes('بريميرليج')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 20)">
          <circle cx="70" cy="80" r="65" fill="#38003C" stroke="#00FF87" strokeWidth="5" />
          {/* Majestic Lion Face with Crown */}
          <polygon points="45,45 55,20 70,35 85,20 95,45" fill="#00FF87" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M40 70 C30 50 110 50 100 70 C110 110 30 110 40 70 Z" fill="#00FF87" stroke="#0F172A" strokeWidth="3" />
          <circle cx="58" cy="72" r="5" fill="#38003C" />
          <circle cx="82" cy="72" r="5" fill="#38003C" />
          <polygon points="65,85 75,85 70,95" fill="#38003C" />
        </g>
      </svg>
    );
  }

  // 5. كرة السلة و NBA (Basketball & Rim)
  if (title.includes('سلة') || title.includes('nba')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 25)">
          <rect x="15" y="10" width="120" height="85" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" rx="4" />
          <rect x="45" y="45" width="60" height="40" fill="none" stroke="#DC2626" strokeWidth="4" />
          <line x1="45" y1="85" x2="105" y2="85" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="115" cy="115" r="42" fill="#F97316" stroke="#0F172A" strokeWidth="4" />
          <line x1="73" y1="115" x2="157" y2="115" stroke="#0F172A" strokeWidth="3" />
          <line x1="115" y1="73" x2="115" y2="157" stroke="#0F172A" strokeWidth="3" />
          <path d="M85 85 Q115 115 85 145" stroke="#0F172A" strokeWidth="3" fill="none" />
          <path d="M145 85 Q115 115 145 145" stroke="#0F172A" strokeWidth="3" fill="none" />
        </g>
      </svg>
    );
  }

  // 6. ملاكمون وأبطال الحلبات (Boxing Gloves)
  if (title.includes('ملاكم') || title.includes('حلبات') || title.includes('قتال')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 25)">
          {/* Left Glove */}
          <path d="M30 40 C10 40 10 80 20 110 C30 130 65 130 75 110 C85 85 85 55 65 40 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <path d="M30 65 C15 70 20 95 35 95" fill="#DC2626" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="25" y="110" width="45" height="22" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          {/* Right Glove */}
          <path d="M90 35 C70 35 70 75 80 105 C90 125 125 125 135 105 C145 80 145 50 125 35 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <rect x="85" y="105" width="45" height="22" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="35" y1="120" x2="60" y2="120" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="95" y1="115" x2="120" y2="115" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 7. الألعاب الأولمبية (Olympic Torch & Rings)
  if (title.includes('أولمبي')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 20)">
          {/* Flaming Golden Torch */}
          <polygon points="65,95 75,95 72,160 68,160" fill="#CA8A04" stroke="#0F172A" strokeWidth="3" />
          <polygon points="55,95 85,95 78,75 62,75" fill="#EAB308" stroke="#0F172A" strokeWidth="3" />
          {/* Fire */}
          <path d="M70 15 C50 40 55 60 70 75 C85 60 90 40 70 15 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />
          <path d="M70 35 C60 50 65 60 70 75 C75 60 80 50 70 35 Z" fill="#FACC15" />
          {/* Olympic Rings */}
          <circle cx="35" cy="140" r="16" fill="none" stroke="#0284C7" strokeWidth="3.5" />
          <circle cx="70" cy="140" r="16" fill="none" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="105" cy="140" r="16" fill="none" stroke="#DC2626" strokeWidth="3.5" />
        </g>
      </svg>
    );
  }

  // 8. سيارات وسوبركارز (Speedster Sports Car)
  if (title.includes('سيار') || title.includes('سوبركارز') || title.includes('محركات') || title.includes('سرعة')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(15, 45)">
          {/* Speedometer behind */}
          <path d="M35 85 A50 50 0 0 1 135 85" fill="none" stroke="#0F172A" strokeWidth="6" strokeDasharray="8 4" />
          <line x1="85" y1="85" x2="115" y2="55" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
          {/* Red Supercar */}
          <path d="M10 110 L30 85 L85 75 L145 85 L165 110 L160 125 L10 125 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <polygon points="40,88 80,78 125,85 135,100 35,100" fill="#38BDF8" stroke="#0F172A" strokeWidth="3" />
          {/* Wheels */}
          <circle cx="45" cy="125" r="18" fill="#1E293B" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="45" cy="125" r="8" fill="#E2E8F0" />
          <circle cx="135" cy="125" r="18" fill="#1E293B" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="135" cy="125" r="8" fill="#E2E8F0" />
          {/* Headlights */}
          <polygon points="155,102 165,105 160,112 150,110" fill="#FEF08A" stroke="#0F172A" strokeWidth="1.5" />
        </g>
      </svg>
    );
  }

  // 9. قطارات وسكك حديد (Bullet Train)
  if (title.includes('قطار') || title.includes('سكك')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 35)">
          <path d="M15 135 L135 135" stroke="#64748B" strokeWidth="6" />
          <line x1="25" y1="130" x2="25" y2="140" stroke="#0F172A" strokeWidth="4" />
          <line x1="55" y1="130" x2="55" y2="140" stroke="#0F172A" strokeWidth="4" />
          <line x1="85" y1="130" x2="85" y2="140" stroke="#0F172A" strokeWidth="4" />
          <line x1="115" y1="130" x2="115" y2="140" stroke="#0F172A" strokeWidth="4" />
          <path d="M20 125 L20 60 C20 40 80 40 120 70 L135 125 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          <polygon points="45,65 105,75 120,95 45,95" fill="#0284C7" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="20" y="100" width="115" height="12" fill="#EF4444" />
          <circle cx="120" cy="115" r="6" fill="#FACC15" stroke="#0F172A" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 10. سفن وبواخر عملاقة (Giant Cruise Ship)
  if (title.includes('سفن') || title.includes('بواخر') || title.includes('موانئ')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(20, 45)">
          {/* Waves */}
          <path d="M0 125 Q20 115 40 125 Q60 135 80 125 Q100 115 120 125 Q140 135 160 125" stroke="#0284C7" strokeWidth="6" fill="none" />
          {/* Hull */}
          <path d="M15 120 L150 120 L160 85 L35 85 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="3.5" />
          {/* Decks */}
          <rect x="35" y="60" width="105" height="25" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
          <rect x="50" y="38" width="75" height="22" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
          {/* Funnels / Chimneys */}
          <rect x="65" y="18" width="16" height="20" fill="#DC2626" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="90" y="18" width="16" height="20" fill="#DC2626" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="65" y1="24" x2="81" y2="24" stroke="#0F172A" strokeWidth="3" />
          <line x1="90" y1="24" x2="106" y2="24" stroke="#0F172A" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 11. تاريخ الطيران والحروب (Supersonic Fighter Jet)
  if (title.includes('طيران') || title.includes('طائرات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 25) rotate(15)">
          <polygon points="70,10 80,45 130,100 85,95 85,130 98,145 70,140 42,145 55,130 55,95 10,100 60,45" fill="#64748B" stroke="#0F172A" strokeWidth="4" />
          <polygon points="70,35 75,55 65,55" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
          <polygon points="65,140 70,165 75,140" fill="#F97316" />
        </g>
      </svg>
    );
  }

  // 12. ألعاب فيديو وبلايستيشن وجوال (Console Gamepad)
  if (title.includes('ألعاب فيديو') || title.includes('بلايستيشن') || title.includes('جيمينج') || title.includes('ألعاب الجوال')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 45)">
          <path d="M30 25 C50 18 80 18 100 25 C120 32 135 70 120 95 C108 115 85 100 75 80 C65 80 55 80 45 80 C35 100 12 115 0 95 C-15 70 10 32 30 25 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="4.5" />
          <rect x="25" y="42" width="8" height="24" rx="2" fill="#38BDF8" />
          <rect x="17" y="50" width="24" height="8" rx="2" fill="#38BDF8" />
          <circle cx="95" cy="46" r="4.5" fill="#EF4444" />
          <circle cx="107" cy="55" r="4.5" fill="#22C55E" />
          <circle cx="83" cy="55" r="4.5" fill="#3B82F6" />
          <circle cx="95" cy="64" r="4.5" fill="#EAB308" />
          <circle cx="48" cy="68" r="11" fill="#64748B" stroke="#0F172A" strokeWidth="2.5" />
          <circle cx="78" cy="68" r="11" fill="#64748B" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 13. ألعاب نينتندو التراثية (Mario Cap & Mushroom)
  if (title.includes('نينتندو') || title.includes('ماريو')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 30)">
          {/* Red Mario Cap */}
          <path d="M20 60 C20 20 110 20 110 60 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="65" cy="65" rx="55" ry="12" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <circle cx="65" cy="45" r="16" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          <text x="65" y="52" fontSize="18" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#DC2626">M</text>
          {/* Mushroom below */}
          <path d="M40 120 C35 90 95 90 90 120 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="65" cy="105" r="8" fill="#FFFFFF" />
          <rect x="52" y="120" width="26" height="20" rx="6" fill="#FED7AA" stroke="#0F172A" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 14. ألعاب الآركيد القديمة (Arcade Cabinet Machine)
  if (title.includes('آركيد') || title.includes('اركيد')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(45, 20)">
          <path d="M20 160 L20 20 L90 20 L90 160 Z" fill="#1E1B4B" stroke="#0F172A" strokeWidth="4" />
          <rect x="28" y="28" width="54" height="18" fill="#FACC15" stroke="#0F172A" strokeWidth="2" />
          <text x="55" y="41" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">ARCADE</text>
          <polygon points="28,52 82,52 75,95 35,95" fill="#0284C7" stroke="#0F172A" strokeWidth="3" />
          {/* Joystick */}
          <line x1="45" y1="120" x2="45" y2="105" stroke="#CBD5E1" strokeWidth="4" />
          <circle cx="45" cy="103" r="6" fill="#DC2626" />
          <circle cx="65" cy="115" r="4" fill="#22C55E" />
          <circle cx="75" cy="115" r="4" fill="#38BDF8" />
        </g>
      </svg>
    );
  }

  // 15. ألعاب الحرب وإطلاق النار (Tactical Helmet & Crosshair)
  if (title.includes('حرب') || title.includes('إطلاق نار') || title.includes('شوتر') || title.includes('معارك')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 30)">
          {/* Sniper Crosshair in background */}
          <circle cx="65" cy="65" r="55" fill="none" stroke="#DC2626" strokeWidth="3" strokeDasharray="8 6" />
          <line x1="65" y1="5" x2="65" y2="125" stroke="#DC2626" strokeWidth="3" />
          <line x1="5" y1="65" x2="125" y2="65" stroke="#DC2626" strokeWidth="3" />
          {/* Military Tactical Helmet */}
          <path d="M20 70 C20 20 110 20 110 70 L115 85 L15 85 Z" fill="#15803D" stroke="#0F172A" strokeWidth="4" />
          <rect x="35" y="55" width="60" height="15" rx="4" fill="#0F172A" />
        </g>
      </svg>
    );
  }

  // 16. أفلام الرعب والبقاء (Horror Skull & Bats)
  if (title.includes('رعب')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(45, 25)">
          <circle cx="55" cy="55" r="50" fill="#FEF08A" stroke="#0F172A" strokeWidth="3.5" />
          {/* Skull */}
          <path d="M25 65 C25 30 85 30 85 65 C85 85 75 90 70 105 L40 105 C35 90 25 85 25 65 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="42" cy="65" rx="8" ry="11" fill="#DC2626" />
          <ellipse cx="68" cy="65" rx="8" ry="11" fill="#DC2626" />
          <polygon points="55,75 50,85 60,85" fill="#0F172A" />
          <line x1="45" y1="98" x2="45" y2="105" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="55" y1="98" x2="55" y2="105" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="65" y1="98" x2="65" y2="105" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 17. أفلام وسينما عالمية + أوسكار (Clapperboard & Gold Trophy)
  if (title.includes('سينما') || title.includes('أفلام') || title.includes('أوسكار') || title.includes('هوليوود')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 40)">
          <rect x="10" y="30" width="120" height="85" rx="6" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3.5" />
          <g transform="rotate(-15, 10, 30)">
            <rect x="10" y="0" width="120" height="30" rx="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3.5" />
            <polygon points="25,0 45,0 35,30 15,30" fill="#FFFFFF" />
            <polygon points="60,0 80,0 70,30 50,30" fill="#FFFFFF" />
            <polygon points="95,0 115,0 105,30 85,30" fill="#FFFFFF" />
          </g>
          <polygon points="70,55 78,72 96,74 82,88 86,106 70,96 54,106 58,88 44,74 62,72" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 18. مسلسلات رمضان الخليجية ومسرحيات كويتية (Ramadan Lantern & Stage)
  if (title.includes('رمضان') || title.includes('مسلسلات') || title.includes('مسرحيات') || title.includes('مسارح') || title.includes('دراما')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(40, 25)">
          {/* Big Fanoos Lantern */}
          <line x1="60" y1="0" x2="60" y2="30" stroke="#0F172A" strokeWidth="3.5" />
          <polygon points="45,30 75,30 65,15 55,15" fill="#EAB308" stroke="#0F172A" strokeWidth="3" />
          <polygon points="35,50 85,50 75,30 45,30" fill="#FACC15" stroke="#0F172A" strokeWidth="3" />
          <rect x="35" y="50" width="50" height="60" fill="#FEF08A" stroke="#0F172A" strokeWidth="3" />
          <polygon points="35,110 85,110 95,135 25,135" fill="#F59E0B" stroke="#0F172A" strokeWidth="3.5" />
          {/* Candle Flame inside */}
          <ellipse cx="60" cy="80" rx="8" ry="14" fill="#F97316" />
          <ellipse cx="60" cy="82" rx="4" ry="8" fill="#FDE047" />
        </g>
      </svg>
    );
  }

  // 19. أنمي وسبيستون وكارتون الطيبين (Dragon Ball Anime Aura)
  if (title.includes('أنمي') || title.includes('سبيستون') || title.includes('كارتون') || title.includes('ديزني') || title.includes('الطيبين')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 25)">
          {/* Golden Spiky Hair */}
          <polygon points="70,10 85,45 105,25 100,60 125,50 105,80 120,95 95,95 70,140 45,95 20,95 35,80 15,50 40,60 35,25 55,45" fill="#FACC15" stroke="#0F172A" strokeWidth="4" />
          {/* Fiery Eye Glare */}
          <polygon points="50,75 62,80 52,85" fill="#0284C7" stroke="#0F172A" strokeWidth="2" />
          <polygon points="90,75 78,80 88,85" fill="#0284C7" stroke="#0F172A" strokeWidth="2" />
          {/* Energy Sparks */}
          <polygon points="125,110 135,120 125,125 130,135" fill="#38BDF8" />
          <polygon points="15,110 5,120 15,125 10,135" fill="#38BDF8" />
        </g>
      </svg>
    );
  }

  // 20. أبطال خارقين ومارفل (Superhero Star Shield)
  if (title.includes('خارقين') || title.includes('مارفل') || title.includes('سوبر')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 30)">
          <circle cx="70" cy="70" r="65" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <circle cx="70" cy="70" r="50" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="70" cy="70" r="36" fill="#DC2626" stroke="#0F172A" strokeWidth="3" />
          <circle cx="70" cy="70" r="22" fill="#0284C7" stroke="#0F172A" strokeWidth="2.5" />
          <polygon points="70,52 74,64 86,64 76,72 80,84 70,76 60,84 64,72 54,64 66,64" fill="#FFFFFF" />
        </g>
      </svg>
    );
  }

  // 21. فضاء ومجرات ومذنبات (Saturn & Deep Galaxy Rocket)
  if (title.includes('فضاء') || title.includes('مجرات') || title.includes('مذنبات') || title.includes('كواكب')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(100, 100) rotate(-25)">
          <ellipse cx="0" cy="0" rx="80" ry="22" fill="none" stroke="#FACC15" strokeWidth="8" />
          <circle cx="0" cy="0" r="45" fill="#818CF8" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="-15" cy="-10" rx="12" ry="6" fill="#C7D2FE" opacity="0.6" />
        </g>
        <g transform="translate(35, 30) rotate(40)">
          <path d="M20 0 C32 20 32 45 20 65 L6 65 C-6 45 -6 20 6 0 Z" fill="#F8FAFC" stroke="#DC2626" strokeWidth="3" />
          <circle cx="13" cy="25" r="6" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
          <polygon points="13,65 20,85 13,78 6,85" fill="#F97316" />
        </g>
      </svg>
    );
  }

  // 22. بحار ومحيطات وحيوانات الأعماق (Breaching Giant Whale)
  if (title.includes('بحار') || title.includes('محيطات') || title.includes('أعماق')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(20, 35)">
          <path d="M20 100 C40 40 100 40 130 75 C145 60 160 55 160 70 C145 85 135 110 110 115 Z" fill="#0284C7" stroke="#0F172A" strokeWidth="4" />
          {/* Belly */}
          <path d="M40 100 Q80 115 110 115" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="45" cy="85" r="4" fill="#0F172A" />
          {/* Water Spout */}
          <path d="M48 65 Q40 40 30 35 M48 65 Q50 35 60 30" stroke="#38BDF8" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Waves */}
          <path d="M0 125 Q40 110 80 125 Q120 140 160 125" stroke="#38BDF8" strokeWidth="6" fill="none" />
        </g>
      </svg>
    );
  }

  // 23. ديناصورات وحيوانات منقرضة (T-Rex Skull)
  if (title.includes('دايناصور') || title.includes('منقرض')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 35)">
          {/* T-Rex Jaw Skull */}
          <path d="M20 40 C60 10 110 20 130 55 L130 85 L85 85 L85 105 L35 105 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="65" cy="45" rx="10" ry="14" fill="#0F172A" />
          <ellipse cx="105" cy="55" rx="8" ry="10" fill="#0F172A" />
          {/* Teeth */}
          <polygon points="85,85 90,98 95,85 100,98 105,85 110,98 115,85 120,98 125,85" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 24. عالم الطيور والصقور (Falcon with Burqa Hood)
  if (title.includes('طيور') || title.includes('صقور')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(45, 25)">
          {/* Falcon Head Profile */}
          <path d="M25 70 C25 35 75 25 95 60 C110 70 125 80 110 95 C95 105 75 125 55 125 Z" fill="#78350F" stroke="#0F172A" strokeWidth="4" />
          {/* Hooked Beak */}
          <path d="M100 70 C125 75 120 100 105 98 Z" fill="#FACC15" stroke="#0F172A" strokeWidth="3" />
          {/* Burqa Hood Ornaments */}
          <path d="M40 50 Q75 40 95 65" stroke="#DC2626" strokeWidth="6" fill="none" />
          <circle cx="75" cy="62" r="7" fill="#0F172A" />
          <circle cx="77" cy="60" r="2.5" fill="#FFFFFF" />
        </g>
      </svg>
    );
  }

  // 25. عالم الحشرات (Stag Beetle)
  if (title.includes('حشرات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(45, 25)">
          {/* Big Pincers */}
          <path d="M35 50 C20 10 45 5 45 35" stroke="#0F172A" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M75 50 C90 10 65 5 65 35" stroke="#0F172A" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Beetle Body */}
          <ellipse cx="55" cy="65" rx="22" ry="20" fill="#15803D" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="55" cy="105" rx="28" ry="36" fill="#166534" stroke="#0F172A" strokeWidth="4" />
          <line x1="55" y1="75" x2="55" y2="140" stroke="#0F172A" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 26. أكلات شعبية وطهي عالمي (Steaming Kabsa Platter)
  if (title.includes('أكلات') || title.includes('طهي') || title.includes('مطابخ') || title.includes('مطاعم') || title.includes('مغرب')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 45)">
          {/* Platter */}
          <ellipse cx="75" cy="105" rx="70" ry="24" fill="#E2E8F0" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="75" cy="100" rx="60" ry="18" fill="#FACC15" stroke="#0F172A" strokeWidth="3" />
          {/* Roasted Meat Chunk */}
          <path d="M50 85 C45 65 95 60 105 85 Z" fill="#92400E" stroke="#0F172A" strokeWidth="3.5" />
          {/* Steam Swirls */}
          <path d="M60 55 Q55 35 65 25 M75 50 Q85 30 75 15 M95 55 Q105 35 95 20" stroke="#94A3B8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 27. حلويات وتسالي ومثلجات (Sweets & Luqaimat)
  if (title.includes('حلويات') || title.includes('تسالي') || title.includes('مثلجات') || title.includes('منتجات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 35)">
          {/* KDD Chocolate Milk Carton */}
          <rect x="15" y="30" width="55" height="85" rx="4" fill="#3B1C0A" stroke="#0F172A" strokeWidth="3.5" />
          <polygon points="15,30 30,12 55,12 70,30" fill="#582910" stroke="#0F172A" strokeWidth="3" />
          <text x="42" y="65" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">KDD</text>
          <text x="42" y="80" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">Milk</text>
          {/* Ice cream cone */}
          <polygon points="90,45 130,45 110,125" fill="#D97706" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="110" cy="40" r="24" fill="#FEF08A" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M96 35 Q110 25 124 35" stroke="#3B1C0A" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 28. مشروبات القهاوي والباريستا (Dallah & Finjan)
  if (title.includes('قهاوي') || title.includes('قهوة') || title.includes('باريستا') || title.includes('شاي')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 25)">
          {/* Golden Dallah Pot */}
          <polygon points="35,140 75,140 68,95 42,95" fill="#EAB308" stroke="#0F172A" strokeWidth="3.5" />
          <polygon points="40,95 70,95 62,45 48,45" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          <polygon points="48,45 62,45 55,20" fill="#CA8A04" stroke="#0F172A" strokeWidth="2.5" />
          {/* Spout */}
          <path d="M42 95 C20 85 10 60 15 45 L25 55 C20 70 35 75 45 80" fill="#EAB308" stroke="#0F172A" strokeWidth="3" />
          {/* Finjan Cup */}
          <polygon points="85,120 115,120 110,140 90,140" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 29. عطور وبخور ودهن عود (Oud Crystal Bottle & Incense)
  if (title.includes('عطور') || title.includes('بخور') || title.includes('عود')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(45, 25)">
          <rect x="25" y="55" width="60" height="75" rx="10" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />
          <rect x="42" y="32" width="26" height="25" rx="3" fill="#CA8A04" stroke="#0F172A" strokeWidth="3" />
          <circle cx="55" cy="20" r="12" fill="#FDE047" stroke="#0F172A" strokeWidth="3" />
          {/* Incense smoke swirls */}
          <path d="M25 35 Q10 15 25 5" stroke="#C084FC" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M85 35 Q100 15 85 5" stroke="#C084FC" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 30. إسلاميات والقرآن وسيرة (The Holy Kaaba & Holy Quran)
  if (title.includes('إسلام') || title.includes('قرآن') || title.includes('أنبياء') || title.includes('عمارة إسلامية') || title.includes('سيرة')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 30)">
          <path d="M20 50 C20 15 80 15 80 50 Z" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          {/* Kaaba */}
          <rect x="15" y="50" width="100" height="85" fill="#0F172A" stroke="#0F172A" strokeWidth="4" />
          <rect x="15" y="65" width="100" height="15" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
          <rect x="75" y="85" width="26" height="50" rx="3" fill="#F59E0B" stroke="#CA8A04" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 31. أسرار الفراعنة (Pharaoh Mask & Pyramids)
  if (title.includes('فراعنة') || title.includes('مصر') || title.includes('أهرامات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 25)">
          {/* Pyramids in back */}
          <polygon points="15,95 65,30 115,95" fill="#D97706" stroke="#0F172A" strokeWidth="3" />
          <polygon points="65,30 115,95 135,95" fill="#92400E" stroke="#0F172A" strokeWidth="3" />
          {/* Golden Pharaoh Mask */}
          <path d="M40 75 C40 45 90 45 90 75 L85 125 L45 125 Z" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="40" y1="85" x2="90" y2="85" stroke="#0284C7" strokeWidth="4" />
          <line x1="42" y1="100" x2="88" y2="100" stroke="#0284C7" strokeWidth="4" />
          <polygon points="60,125 70,125 65,145" fill="#0284C7" stroke="#0F172A" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 32. أساطير وخرافات (Fire Dragon)
  if (title.includes('أساطير') || title.includes('خرافات') || title.includes('تنانين')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 25)">
          <path d="M35 120 C15 70 45 35 75 35 C115 35 145 70 125 120 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          {/* Horns */}
          <path d="M45 40 C35 15 20 20 25 35" stroke="#0F172A" strokeWidth="4.5" fill="#FACC15" />
          <path d="M105 40 C115 15 130 20 125 35" stroke="#0F172A" strokeWidth="4.5" fill="#FACC15" />
          <circle cx="55" cy="65" r="7" fill="#FEF08A" stroke="#0F172A" strokeWidth="2" />
          <circle cx="95" cy="65" r="7" fill="#FEF08A" stroke="#0F172A" strokeWidth="2" />
          {/* Fire breath */}
          <path d="M75 95 C65 135 85 145 75 160" stroke="#F97316" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 33. عجائب الدنيا والمعالم (Colosseum Arches)
  if (title.includes('عجائب') || title.includes('معالم')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(25, 45)">
          <rect x="15" y="30" width="120" height="75" rx="6" fill="#FDE047" stroke="#0F172A" strokeWidth="4" />
          {/* Arches */}
          <path d="M25 60 C25 45 45 45 45 60 L45 75 L25 75 Z" fill="#78350F" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M55 60 C55 45 75 45 75 60 L75 75 L55 75 Z" fill="#78350F" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M85 60 C85 45 105 45 105 60 L105 75 L85 75 Z" fill="#78350F" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M115 60 C115 45 125 45 125 60 L125 75 L115 75 Z" fill="#78350F" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 34. ألعاب لوحية وبلوت وشدة (Baloot Suits: Spade, Heart, Diamond, Club)
  if (title.includes('بلوت') || title.includes('شدة') || title.includes('ورق') || title.includes('لوحية')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 25)">
          <rect x="10" y="10" width="75" height="105" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          {/* Spade */}
          <path d="M47 35 C35 50 30 65 47 65 C47 75 45 78 40 80 L55 80 C50 78 47 75 47 65 C65 65 60 50 47 35 Z" fill="#0F172A" />
          {/* Heart */}
          <rect x="55" y="40" width="75" height="105" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          <path d="M92 75 C75 55 92 45 92 60 C92 45 110 55 92 75 Z" fill="#DC2626" />
        </g>
      </svg>
    );
  }

  // 35. أمثال وحكم وألغاز (3D Dice, Jigsaw, Domino)
  if (title.includes('أمثال') || title.includes('حكم') || title.includes('ألغاز') || title.includes('فوازير')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 25)">
          <rect x="10" y="10" width="45" height="45" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="22" cy="22" r="3.5" fill="#0F172A" />
          <circle cx="32" cy="32" r="3.5" fill="#0F172A" />
          <circle cx="43" cy="43" r="3.5" fill="#0F172A" />
          {/* Green Jigsaw */}
          <path d="M80 15 L100 15 C100 8 110 8 110 15 L130 15 L130 35 C137 35 137 45 130 45 L130 65 L110 65 C110 72 100 72 100 65 L80 65 Z" fill="#22C55E" stroke="#0F172A" strokeWidth="3.5" />
          {/* Domino */}
          <rect x="40" y="75" width="40" height="70" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="40" y1="110" x2="80" y2="110" stroke="#0F172A" strokeWidth="3" />
          <circle cx="60" cy="92" r="3.5" fill="#0F172A" />
          <circle cx="50" cy="125" r="3" fill="#0F172A" />
          <circle cx="70" cy="125" r="3" fill="#0F172A" />
        </g>
      </svg>
    );
  }

  // 36. تقنية وذكاء اصطناعي وهواتف (AI Microchip & Hologram)
  if (title.includes('تقني') || title.includes('ذكاء') || title.includes('هواتف') || title.includes('كمبيوتر')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(40, 40)">
          <rect x="20" y="20" width="80" height="80" rx="14" fill="#0F172A" stroke="#06B6D4" strokeWidth="4" />
          <rect x="35" y="35" width="50" height="50" rx="8" fill="#06B6D4" />
          <text x="60" y="66" fontSize="20" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">AI</text>
          {/* Chip Pins */}
          <line x1="40" y1="5" x2="40" y2="20" stroke="#06B6D4" strokeWidth="4" />
          <line x1="60" y1="5" x2="60" y2="20" stroke="#06B6D4" strokeWidth="4" />
          <line x1="80" y1="5" x2="80" y2="20" stroke="#06B6D4" strokeWidth="4" />
          <line x1="40" y1="100" x2="40" y2="115" stroke="#06B6D4" strokeWidth="4" />
          <line x1="60" y1="100" x2="60" y2="115" stroke="#06B6D4" strokeWidth="4" />
          <line x1="80" y1="100" x2="80" y2="115" stroke="#06B6D4" strokeWidth="4" />
        </g>
      </svg>
    );
  }

  // 37. أسرار المخ البشري والنوم (Glowing Brain & Synapses)
  if (title.includes('مخ') || title.includes('نوم') || title.includes('أحلام') || title.includes('صحة')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 30)">
          <path d="M40 70 C20 40 40 10 70 15 C90 0 120 20 115 50 C130 70 120 100 100 110 C80 125 40 115 40 70 Z" fill="#F472B6" stroke="#0F172A" strokeWidth="4" />
          <path d="M50 50 Q75 60 70 90" stroke="#BE185D" strokeWidth="3.5" fill="none" />
          <path d="M70 30 Q85 50 100 45" stroke="#BE185D" strokeWidth="3.5" fill="none" />
          <circle cx="70" cy="55" r="4" fill="#FDE047" />
          <circle cx="95" cy="75" r="4" fill="#FDE047" />
        </g>
      </svg>
    );
  }

  // 38. روايات وكتب وشعراء (Stack of Classic Books & Pen)
  if (title.includes('روايات') || title.includes('كتب') || title.includes('شعراء') || title.includes('معلقات') || title.includes('لغات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 45)">
          <rect x="15" y="80" width="105" height="25" rx="4" fill="#DC2626" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="22" y="55" width="95" height="25" rx="4" fill="#2563EB" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="30" y="30" width="85" height="25" rx="4" fill="#16A34A" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="75" y1="10" x2="115" y2="40" stroke="#CA8A04" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 39. شخصيات المحققين (Sherlock Cap & Magnifying Glass)
  if (title.includes('محقق') || title.includes('بوليس') || title.includes('مشهور')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 30)">
          {/* Fedora hat */}
          <ellipse cx="65" cy="50" rx="55" ry="14" fill="#92400E" stroke="#0F172A" strokeWidth="4" />
          <path d="M35 50 C35 20 50 10 65 10 C80 10 95 20 95 50 Z" fill="#78350F" stroke="#0F172A" strokeWidth="3.5" />
          {/* Big Magnifying Glass */}
          <circle cx="85" cy="95" r="28" fill="#38BDF8" fillOpacity="0.4" stroke="#0F172A" strokeWidth="4" />
          <line x1="105" y1="115" x2="135" y2="145" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 40. تاريخ العملات والنقود (Chest of Gold Coins)
  if (title.includes('عملات') || title.includes('نقود') || title.includes('فلوس')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 45)">
          <ellipse cx="65" cy="110" rx="55" ry="20" fill="#E2E8F0" stroke="#0F172A" strokeWidth="3.5" />
          {/* Gold Coin Stack */}
          <circle cx="45" cy="75" r="24" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="45" cy="75" r="16" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
          <text x="45" y="82" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">$</text>
          <circle cx="85" cy="70" r="26" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="85" cy="70" r="18" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
          <text x="85" y="78" fontSize="18" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#0F172A">€</text>
        </g>
      </svg>
    );
  }

  // 41. أبراج وناطحات سحاب (Skyscrapers)
  if (title.includes('أبراج') || title.includes('ناطحات')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 20)">
          <rect x="15" y="55" width="35" height="110" fill="#64748B" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="45" y="15" width="45" height="150" fill="#0284C7" stroke="#0F172A" strokeWidth="4" />
          <polygon points="45,15 67,0 90,15" fill="#38BDF8" stroke="#0F172A" strokeWidth="3" />
          <rect x="85" y="75" width="35" height="90" fill="#94A3B8" stroke="#0F172A" strokeWidth="3.5" />
        </g>
      </svg>
    );
  }

  // 42. جغرافيا وعواصم ودول وأعلام (World Globe + Luggage)
  if (title.includes('جغرافيا') || title.includes('عواصم') || title.includes('دول') || title.includes('أعلام') || title.includes('جزر') || title.includes('شبه الجزيرة')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 25)">
          <circle cx="70" cy="70" r="60" fill="#38BDF8" stroke="#0F172A" strokeWidth="4" />
          {/* Continents */}
          <path d="M35 35 Q60 40 70 30 Q85 55 60 70 Q45 80 30 60 Z" fill="#22C55E" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M60 80 Q95 75 110 100 Q90 120 65 115 Z" fill="#22C55E" stroke="#0F172A" strokeWidth="2.5" />
          {/* Red Flag */}
          <line x1="120" y1="30" x2="120" y2="85" stroke="#0F172A" strokeWidth="3.5" />
          <polygon points="120,30 150,45 120,60" fill="#DC2626" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 43. الإمارات (Burj Khalifa + Falcon)
  if (title.includes('إمارات') || title.includes('دبي') || title.includes('أبوظبي')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(100, 15)">
          <line x1="25" y1="0" x2="25" y2="175" stroke="#0F172A" strokeWidth="4" />
          <path d="M15 175 L20 35 L30 35 L35 175 Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
        </g>
        <g transform="translate(20, 60)">
          <path d="M50 10 C35 30 20 50 0 55 C30 60 50 50 60 45 C75 55 95 50 105 35 C85 30 65 20 50 10 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="55" cy="24" r="3.5" fill="#0F172A" />
        </g>
      </svg>
    );
  }

  // 44. قطر (Dhow Ship + Giant Pearl Oyster)
  if (title.includes('قطر') || title.includes('دوحة')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(30, 40)">
          <path d="M15 85 L115 85 L95 125 L30 125 Z" fill="#78350F" stroke="#0F172A" strokeWidth="3.5" />
          <polygon points="40,85 40,15 105,75" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="125" cy="120" r="16" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // 45. البحرين (Bab Al Bahrain Gateway)
  if (title.includes('بحرين')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(40, 45)">
          <rect x="15" y="30" width="90" height="85" rx="6" fill="#F8FAFC" stroke="#0F172A" strokeWidth="4" />
          <polygon points="10,30 60,0 110,30" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
          <path d="M40 115 C40 70 80 70 80 115 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="4" />
        </g>
      </svg>
    );
  }

  // 46. عُمان (Omani Khanjar Dagger)
  if (title.includes('عمان') || title.includes('عُمان')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(60, 35)">
          <path d="M40 20 L40 60 L75 120 L55 135 L15 80 L25 20 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="4" />
          <rect x="25" y="8" width="30" height="22" rx="4" fill="#FACC15" stroke="#0F172A" strokeWidth="3" />
          <circle cx="40" cy="70" r="10" fill="#15803D" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }

  // 47. حيوانات والأسد (Lion King)
  if (title.includes('حيوان')) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {bg}
        <g transform="translate(35, 20)">
          <path d="M65 10 C25 10 5 45 8 85 C12 125 35 150 65 160 C95 150 118 125 122 85 C125 45 105 10 65 10 Z" fill="#92400E" stroke="#0F172A" strokeWidth="4.5" />
          <ellipse cx="65" cy="75" rx="38" ry="40" fill="#FACC15" stroke="#0F172A" strokeWidth="4" />
          <circle cx="52" cy="65" r="5" fill="#0F172A" />
          <circle cx="78" cy="65" r="5" fill="#0F172A" />
          <polygon points="60,78 70,78 65,88" fill="#451A03" />
        </g>
      </svg>
    );
  }

  // =========================================================================
  // DYNAMIC HEROIC COMIC SCENE (Customized by topic hash with distinct hero badges)
  // Ensures all other topics have huge, bold, creative vector scenes!
  // =========================================================================
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const palettes = [
    { sky: '#DDF0F9', badge: '#FACC15', stroke: '#CA8A04', accent: '#DC2626' },
    { sky: '#E0F2FE', badge: '#38BDF8', stroke: '#0284C7', accent: '#F59E0B' },
    { sky: '#DCFCE7', badge: '#4ADE80', stroke: '#16A34A', accent: '#059669' },
    { sky: '#FCE7F3', badge: '#F472B6', stroke: '#DB2777', accent: '#9333EA' },
    { sky: '#FEF3C7', badge: '#FBBF24', stroke: '#D97706', accent: '#DC2626' },
    { sky: '#EDE9FE', badge: '#A78BFA', stroke: '#7C3AED', accent: '#4F46E5' }
  ];
  const pal = palettes[Math.abs(hash) % palettes.length];

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill={pal.sky} rx="16" />
      {/* High-impact comic sunburst rays */}
      <g opacity="0.35" stroke="#0F172A" strokeWidth="3" strokeDasharray="8 6">
        <line x1="100" y1="10" x2="100" y2="190" />
        <line x1="10" y1="100" x2="190" y2="100" />
        <line x1="25" y1="25" x2="175" y2="175" />
        <line x1="175" y1="25" x2="25" y2="175" />
      </g>
      {/* Massive Heroic Comic Badge */}
      <circle cx="100" cy="95" r="68" fill={pal.badge} stroke="#0F172A" strokeWidth="5.5" />
      <circle cx="100" cy="95" r="56" fill="#FFFFFF" stroke={pal.stroke} strokeWidth="3" />
      {/* Huge topic emblem icon */}
      <text 
        x="100" 
        y="112" 
        fontSize="68" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.3))' }}
      >
        {icon}
      </text>
      {/* Comic star badge */}
      <polygon points="160,35 164,48 178,50 166,60 170,74 158,66 146,74 150,60 138,50 152,48" fill="#FACC15" stroke="#0F172A" strokeWidth="2.5" />
    </svg>
  );
};
