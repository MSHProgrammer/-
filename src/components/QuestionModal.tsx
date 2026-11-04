import React, { useState, useEffect } from 'react';
import { ActiveQuestionState, Team, LifelineType, Question } from '../types/jamr';
import { 
  Clock, HelpCircle, Check, X, ShieldAlert, Sparkles, AlertCircle, Phone, 
  ArrowLeftRight, UserMinus, Flame, Play, Pause, Image as ImageIcon, 
  Video as VideoIcon, Film, RefreshCw, ArrowRight, Shuffle, Timer
} from 'lucide-react';
import { sound } from '../services/soundFx';
import { isVideoContent, getYouTubeEmbedUrl } from '../utils/media';

interface QuestionPageViewProps {
  activeQuestion: ActiveQuestionState;
  teams: { team1: Team; team2: Team };
  onAwardPoints: (winnerTeam: 'team1' | 'team2' | 'pass') => void;
  onUseLifeline: (type: LifelineType) => void;
  onClose: () => void;
  onSwapQuestion?: () => void;
  availableQuestions?: Question[];
  isHostOrLocal: boolean;
  lifelinesEnabled?: boolean;
}

export const QuestionPageView: React.FC<QuestionPageViewProps> = ({
  activeQuestion,
  teams,
  onAwardPoints,
  onUseLifeline,
  onClose,
  onSwapQuestion,
  availableQuestions = [],
  isHostOrLocal,
  lifelinesEnabled = true
}) => {
  const { question, topic, tile, answeringTeam, remainingSeconds, timerRunning, twoAnswersAttemptsLeft } = activeQuestion;
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(remainingSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState(!timerRunning);

  // Periodic Auto-Change Question State ("السؤال يتغير كل شوي")
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateSeconds, setRotateSeconds] = useState(25);
  const [isSwapping, setIsSwapping] = useState(false);

  const currentAnsweringTeam = teams[answeringTeam];

  // Calculate alternate questions count in this topic
  const alternateQuestionsCount = availableQuestions.filter(
    q => q.topicId === topic.id && q.id !== question.id
  ).length;

  // Reset internal states whenever the question itself changes
  useEffect(() => {
    setAnswerRevealed(false);
    setShowHint(false);
    setHintIndex(0);
    setLocalSeconds(remainingSeconds);
    setRotateSeconds(25);
    setIsSwapping(true);
    const timeout = setTimeout(() => setIsSwapping(false), 300);
    return () => clearTimeout(timeout);
  }, [question.id]);

  // Main match timer loop
  useEffect(() => {
    if (isTimerPaused || answerRevealed) return;
    if (localSeconds <= 0) {
      sound.playWrong();
      return;
    }

    const timer = setInterval(() => {
      setLocalSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playWrong();
          return 0;
        }
        if (prev <= 10) {
          sound.playTick(true);
        } else {
          sound.playTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused, answerRevealed, localSeconds]);

  // Periodic Question Rotation Loop ("بحيث ان السؤال يتغير كل شوي")
  useEffect(() => {
    if (!autoRotate || answerRevealed || isTimerPaused) return;

    const rotateTimer = setInterval(() => {
      setRotateSeconds(prev => {
        if (prev <= 1) {
          // Trigger swap
          if (onSwapQuestion) {
            onSwapQuestion();
          }
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(rotateTimer);
  }, [autoRotate, answerRevealed, isTimerPaused, onSwapQuestion]);

  const handleRevealAnswer = () => {
    sound.playClick();
    setAnswerRevealed(true);
    setIsTimerPaused(true);
  };

  const handleScore = (result: 'team1' | 'team2' | 'pass') => {
    if (result === 'pass') {
      sound.playWrong();
    } else {
      sound.playCorrect();
    }
    onAwardPoints(result);
  };

  const handleManualSwap = () => {
    sound.playTileSelect();
    if (onSwapQuestion) {
      onSwapQuestion();
    }
  };

  // Lifelines
  const availableLifelines = currentAnsweringTeam.lifelines;

  const handleLifelineClick = (type: LifelineType) => {
    sound.playLifeline();
    if (type === 'call_friend') {
      setLocalSeconds(prev => prev + 30);
    }
    onUseLifeline(type);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 text-right animate-in fade-in duration-200">
      
      {/* Top Breadcrumb Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-orange-600" />
          <span>العودة إلى لوحة اللعبة (إلغاء السؤال)</span>
        </button>

        {/* Question Alternate & Periodic Rotation Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {onSwapQuestion && isHostOrLocal && !answerRevealed && (
            <>
              {/* Manual Swap Button */}
              <button
                onClick={handleManualSwap}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                title="استبدال السؤال بسؤال بديل من نفس الموضوع"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>تبديل السؤال الآن 🔀</span>
              </button>

              {/* Auto-Rotation Toggle */}
              <button
                onClick={() => {
                  sound.playClick();
                  setAutoRotate(!autoRotate);
                  setRotateSeconds(25);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  autoRotate
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="تفعيل التبديل الدوري التلقائي للسؤال كل 25 ثانية"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin text-orange-600' : 'text-slate-400'}`} />
                <span>{autoRotate ? `تبديل دوري نشط (${rotateSeconds}ث)` : 'تفعيل تبديل السؤال كل شوي ⏱️'}</span>
              </button>
            </>
          )}

          {alternateQuestionsCount > 0 && (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {alternateQuestionsCount} أسئلة بديلة متوفرة
            </span>
          )}
        </div>
      </div>

      {/* Main Page Content Card */}
      <div className={`bg-white rounded-3xl border-2 border-orange-200/90 shadow-xl overflow-hidden transition-all duration-300 ${isSwapping ? 'opacity-50 scale-[0.99]' : 'opacity-100 scale-100'}`}>
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-amber-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-xs bg-white shrink-0">
              <img src={topic.coverImage} alt={topic.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
                  {topic.category}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  سؤال رقم {tile.row + 1}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{topic.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-black text-base shadow-md">
              <Sparkles className="w-4 h-4" />
              <span>+{question.points} نقطة</span>
            </div>
          </div>
        </div>

        {/* Turn & Answering Team Banner + Timer */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">الدور للإجابة:</span>
            <span 
              className="px-3 py-1 rounded-full font-black text-white shadow-xs text-xs"
              style={{ backgroundColor: currentAnsweringTeam.color }}
            >
              {currentAnsweringTeam.name}
            </span>
            {twoAnswersAttemptsLeft && twoAnswersAttemptsLeft > 0 && (
              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-lg border border-purple-200">
                فرصة ثانية مفعّلة ({twoAnswersAttemptsLeft})
              </span>
            )}
          </div>

          {/* Timer Widget */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono font-black text-sm ${
              localSeconds <= 5 
                ? 'bg-red-100 text-red-700 animate-pulse border border-red-300' 
                : localSeconds <= 10 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-white text-slate-800 border border-slate-200'
            }`}>
              <Clock className="w-4 h-4 text-orange-600" />
              <span>{localSeconds} ثانية</span>
            </div>

            {isHostOrLocal && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsTimerPaused(!isTimerPaused);
                }}
                title={isTimerPaused ? 'استئناف المؤقت' : 'إيقاف المؤقت مؤقتاً'}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
              >
                {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Auto Rotate Progress Bar if active */}
        {autoRotate && !answerRevealed && (
          <div className="w-full bg-amber-100 h-1.5 overflow-hidden">
            <div 
              className="bg-orange-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(rotateSeconds / 25) * 100}%` }}
            />
          </div>
        )}

        {/* Main Question Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="min-h-[160px] flex flex-col justify-center bg-orange-50/40 rounded-2xl p-6 sm:p-8 border border-orange-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-orange-700 block">السؤال المطروح:</span>
              {autoRotate && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  سيتغير السؤال خلال {rotateSeconds} ثانية
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              {question.questionText}
            </h1>

            {/* Media (Image or Video) if attached */}
            {question.mediaUrl && (
              <div className="mt-5 rounded-2xl overflow-hidden border border-orange-200/80 bg-slate-950/5 shadow-inner">
                {isVideoContent(question.mediaUrl, question.mediaType) ? (
                  <div className="relative w-full">
                    <div className="px-4 py-2 bg-slate-900 text-white text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <VideoIcon className="w-4 h-4 text-red-500" />
                        <span>فيديو مرفق مع السؤال</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">شاهد الفيديو للإجابة على التحدي</span>
                    </div>

                    {getYouTubeEmbedUrl(question.mediaUrl) ? (
                      <div className="relative w-full aspect-video">
                        <iframe
                          src={getYouTubeEmbedUrl(question.mediaUrl)!}
                          title="فيديو السؤال"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-black flex justify-center">
                        <video
                          src={question.mediaUrl}
                          controls
                          playsInline
                          className="w-full max-h-80 rounded-lg object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative group bg-white">
                    <div className="px-4 py-1.5 bg-orange-50/90 border-b border-orange-200 text-xs font-bold text-orange-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-orange-600" />
                      <span>صورة مرفقة مع السؤال</span>
                    </div>
                    <div className="p-3 flex items-center justify-center max-h-80 overflow-hidden bg-slate-50">
                      <img
                        src={question.mediaUrl}
                        alt="سؤال مصور"
                        className="max-h-76 max-w-full rounded-xl object-contain shadow-xs border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lifelines quick bar during question (only if lifelines are enabled for the match) */}
          {lifelinesEnabled && isHostOrLocal && !answerRevealed && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-black text-amber-900">وسائل مساعدة {currentAnsweringTeam.name}:</span>
                <span className="text-[11px] text-amber-700">متاحة لمرة واحدة في المباراة</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {/* 1. Two answers */}
                <button
                  type="button"
                  disabled={!availableLifelines.two_answers}
                  onClick={() => handleLifelineClick('two_answers')}
                  className="p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-orange-50 border-orange-200 text-orange-900"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>جوابين</span>
                </button>

                {/* 2. Call friend */}
                <button
                  type="button"
                  disabled={!availableLifelines.call_friend}
                  onClick={() => handleLifelineClick('call_friend')}
                  className="p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-900"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>صديق (+30ث)</span>
                </button>

                {/* 3. Pitfall */}
                <button
                  type="button"
                  disabled={!availableLifelines.pitfall}
                  onClick={() => handleLifelineClick('pitfall')}
                  className="p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-red-50 border-red-200 text-red-900"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>الحفرة</span>
                </button>

                {/* 4. Bench player */}
                <button
                  type="button"
                  disabled={!availableLifelines.bench_player}
                  onClick={() => handleLifelineClick('bench_player')}
                  className="p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-blue-50 border-blue-200 text-blue-900"
                >
                  <UserMinus className="w-3.5 h-3.5 text-blue-600" />
                  <span>استريح</span>
                </button>

                {/* 5. The Trap */}
                <button
                  type="button"
                  disabled={!availableLifelines.the_trap}
                  onClick={() => handleLifelineClick('the_trap')}
                  className="p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-purple-50 border-purple-200 text-purple-900"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                  <span>الفخ</span>
                </button>
              </div>
            </div>
          )}

          {/* Hints Section */}
          {question.hints && question.hints.length > 0 && (
            <div>
              {!showHint ? (
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowHint(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>كشف تلميح مساعد 💡</span>
                </button>
              ) : (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs">
                  <span className="font-black text-amber-900 block mb-1">💡 تلميح:</span>
                  <p className="text-amber-800 font-medium text-sm leading-relaxed">{question.hints[hintIndex]}</p>
                </div>
              )}
            </div>
          )}

          {/* Model Answer (Revealed) */}
          {answerRevealed && (
            <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-300 text-right animate-in fade-in duration-300 shadow-sm">
              <span className="text-xs font-black text-emerald-800 block mb-1.5">الإجابة النموذجية الصحيحة:</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-950 mb-2">
                {question.answerText}
              </p>
              {question.explanation && (
                <p className="text-xs sm:text-sm text-emerald-800 font-medium leading-relaxed border-t border-emerald-200 pt-3 mt-3">
                  {question.explanation}
                </p>
              )}
            </div>
          )}

          {/* Action / Scoring Buttons for Host or Local Match */}
          {isHostOrLocal && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              {!answerRevealed ? (
                <button
                  onClick={handleRevealAnswer}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>كشف الإجابة النموذجية والتحكيم</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleScore('team1')}
                    className="py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>صحيحة لـ {teams.team1.name} (+{question.points})</span>
                  </button>

                  <button
                    onClick={() => handleScore('team2')}
                    className="py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>صحيحة لـ {teams.team2.name} (+{question.points})</span>
                  </button>

                  <button
                    onClick={() => handleScore('pass')}
                    className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                    <span>لم يُجب أحد / خطأ (تخطي)</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

// Also export as QuestionModal for backward compatibility
export const QuestionModal = QuestionPageView;
