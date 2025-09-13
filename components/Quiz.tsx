import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DrillSettings, Note, Question, Scale, MusicKey, UserData, PerformanceUpdate, DrillMode, DrillCompletionResult, SweeperPhase, NoteDiscoveryRound, ScaleType, QuizPhase, DegreeDashPhase, Language } from '../types';
import { generateDrillQuestions, getScale, getUniqueAnswersForQuestion, getFretboardNotes, getDegreeFromNote, getIntervalSequenceForScale } from '../services/music';
import { useMidi } from '../hooks/useMidi';
import { useAudioPitch } from '../hooks/useAudioPitch';
import { Piano } from './Piano';
import Fretboard from './Fretboard';
import HelpModal from './HelpModal';
import { MUSIC_KEYS, ALL_NOTES, GUITAR_TUNING, BASS_TUNING, DEGREE_NAMES, INTERVAL_NAMES, SCALE_TYPES, INTERVAL_STEP_NAMES } from '../constants';
import PreQuizInfo from './PreQuizInfo';
import Countdown from './Countdown';
import { playNoteSound, playCorrectSound, playIncorrectSound, playBeatSound, playUIClick } from '../services/sound';
import { HelpIcon, ToggleDegreesIcon, QuitIcon, HeartIcon, XMarkIcon } from './Icons';
import GalaxyConstructor from './GalaxyConstructor';
import { playVibration, VIBRATION_PATTERNS } from '../services/haptics';
import { useSustainedNote } from '../hooks/useSustainedNote';
import WarpSpeedBackground from './WarpSpeedBackground';
import DegreeDash from './DegreeDash';
import FeedbackBadge from './FeedbackBadge';
// FIX: Import TKey for strong typing with the translator function.
import { createTranslator, TKey } from '../services/translations';

// ====================================================================================
// SHARED TYPES AND CONSTANTS
// ====================================================================================

interface QuizProps {
  settings: DrillSettings;
  onQuit: () => void;
  userData: UserData;
  onUpdatePerformance: (update: PerformanceUpdate) => void;
  onDrillComplete: (result: DrillCompletionResult) => void;
  onToggleSkipPreDrillInfo: (drillMode: DrillMode, skip: boolean) => void;
}

interface DrillComponentProps extends QuizProps {
  quizPhase: QuizPhase;
  setQuizPhase: React.Dispatch<React.SetStateAction<QuizPhase>>;
  handleFinish: (success: boolean, customMessage?: string, scoreOverride?: number | string) => void;
  questions: Question[];
  currentQuestion: Question;
  goToNextQuestion: () => void;
}

type InstrumentLabelMode = 'notes' | 'degrees';

interface CompletionData {
    success: boolean;
    score: number;
    totalQuestions: number;
    finalMessage: string;
    accuracy?: number;
    maxStreak?: number;
    avgResponseTime?: number;
    completionMetric?: { value: number | string, label: string };
}

const QUESTION_BEAT_LIMIT = 10;
const BPM_INCREASE_THRESHOLD = 10;
const BPM_INCREMENT = 10;

const getNoteNameFromUniqueId = (id: string): Note | null => {
    const name = id.replace(/-?\d.*$/, '');
    const foundNote = ALL_NOTES.find(n => n === name);
    return foundNote || null;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ====================================================================================
// REFACTORED DRILL COMPONENTS
// ====================================================================================

/**
 * KeyConjurerDrill: An adaptive, high-speed drill for note recognition mastery.
 */
const KeyConjurerDrill: React.FC<DrillComponentProps> = ({ settings, onUpdatePerformance, handleFinish, quizPhase, onQuit }) => {
    const [level, setLevel] = useState(1);
    const [currentBpm, setCurrentBpm] = useState(settings.bpm);
    const [levelUpAnimation, setLevelUpAnimation] = useState(false);
    
    const [beats, setBeats] = useState(settings.totalBeats);
    const [mastered, setMastered] = useState(new Set<Note>());
    const [unmasteredPool, setUnmasteredPool] = useState<Note[]>(() => shuffleArray([...ALL_NOTES]));
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    
    const [feedback, setFeedback] = useState<{ note: string, correct: boolean } | null>(null);
    const [scoreChange, setScoreChange] = useState<{ value: number, id: number } | null>(null);
    const [mcqOptions, setMcqOptions] = useState<Note[]>([]);
    const [revealedNotes, setRevealedNotes] = useState(new Set<Note>(['C', 'F']));
    const [feedbackBadge, setFeedbackBadge] = useState<{ text: string, id: number } | null>(null);
    const hintTickCounterRef = useRef(0);
    const t = createTranslator(settings.language);

    // Initial question setup
    useEffect(() => {
        if (quizPhase === 'active' && !currentNote) {
            setCurrentNote(unmasteredPool[0]);
        }
    }, [quizPhase, currentNote, unmasteredPool]);

    // MCQ options generation
    useEffect(() => {
        if (quizPhase === 'active' && currentNote) {
            const distractors = ALL_NOTES
                .filter(n => n !== currentNote)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            setMcqOptions(shuffleArray([currentNote, ...distractors]));
        }
    }, [quizPhase, currentNote]);

    // Beat timer
    useEffect(() => {
        if (quizPhase !== 'active' || currentBpm === 0) return;
        const intervalTime = (60 / currentBpm) * 1000;

        const interval = setInterval(() => {
            playBeatSound();
            playVibration(VIBRATION_PATTERNS.TICK);
            
            setBeats(b => {
                const newBeats = b - 1;
                if (newBeats <= 0) {
                    clearInterval(interval);
                    handleFinish(false, undefined, level);
                    return 0;
                }
                return newBeats;
            });

            hintTickCounterRef.current += 1;
            if (hintTickCounterRef.current >= 10) {
                hintTickCounterRef.current = 0;
                setRevealedNotes(prevRevealed => {
                    const removable = [...prevRevealed].filter(n => !mastered.has(n) && n !== currentNote);
                    if (removable.length > 0) {
                        const noteToRemove = removable[Math.floor(Math.random() * removable.length)];
                        const newRevealed = new Set(prevRevealed);
                        newRevealed.delete(noteToRemove);
                        return newRevealed;
                    }
                    return prevRevealed;
                });
            }
        }, intervalTime);

        return () => clearInterval(interval);
    }, [quizPhase, currentBpm, handleFinish, mastered, currentNote, level]);

    const handleAnswer = useCallback(async (playedNoteName: Note) => {
        if (feedback || !currentNote) return;

        await playNoteSound(playedNoteName, settings.instrument);
        
        const isCorrect = playedNoteName === currentNote;
        setFeedback({ note: playedNoteName, correct: isCorrect });
        onUpdatePerformance({ isCorrect, drillMode: settings.drillMode });
        
        if (isCorrect) {
            playCorrectSound();
            setFeedbackBadge({ text: t('excellent', { note: currentNote }), id: Date.now() });
            setBeats(b => b + settings.beatAward);
            setScoreChange({ value: settings.beatAward, id: Date.now() });
            setRevealedNotes(prev => new Set(prev).add(currentNote));

            setTimeout(() => {
                setFeedback(null);
                const newMastered = new Set(mastered).add(currentNote);
                setMastered(newMastered);

                if (newMastered.size === ALL_NOTES.length) {
                    if (level >= 10) {
                        handleFinish(true, t('allKeysMastered'), 10);
                    } else {
                        setLevelUpAnimation(true);
                        setTimeout(() => setLevelUpAnimation(false), 1500);
                        
                        setLevel(prev => prev + 1);
                        setCurrentBpm(prev => prev + 10);
                        setMastered(new Set());
                        const newPool = shuffleArray([...ALL_NOTES]);
                        setUnmasteredPool(newPool);
                        // Always reset to the base hints for the new level
                        setRevealedNotes(new Set(['C', 'F']));
                        setCurrentNote(newPool[0]);
                        setBeats(b => b + 10); // Level complete bonus
                    }
                } else {
                    const newPool = unmasteredPool.filter(n => n !== currentNote);
                    setUnmasteredPool(newPool);
                    setCurrentNote(newPool[Math.floor(Math.random() * newPool.length)]);
                }
            }, 800);
        } else {
            playIncorrectSound();
            playVibration(VIBRATION_PATTERNS.INCORRECT);
            setFeedbackBadge({ text: t('tryAgain'), id: Date.now() });
            setBeats(b => Math.max(0, b - settings.beatPenalty));
            setScoreChange({ value: -settings.beatPenalty, id: Date.now() });

            // On a wrong answer, remove a random, revealed hint (excluding the current question).
            setRevealedNotes(prevRevealed => {
                const removable = [...prevRevealed].filter(n => n !== currentNote);
                
                if (removable.length > 0) {
                    const noteToRemove = removable[Math.floor(Math.random() * removable.length)];
                    const newRevealed = new Set(prevRevealed);
                    newRevealed.delete(noteToRemove);
                    return newRevealed;
                }
                return prevRevealed;
            });

            setTimeout(() => setFeedback(null), 800);
        }
    }, [feedback, currentNote, settings.instrument, settings.drillMode, settings.beatAward, settings.beatPenalty, onUpdatePerformance, mastered, unmasteredPool, handleFinish, t, level]);

    const healthPercent = (beats / settings.totalBeats) * 100;
    const isDanger = healthPercent < 25;
    const vignetteOpacity = healthPercent < 60 ? (1 - (healthPercent / 60)) * 0.8 : 0;

    const renderedInstrument = useMemo(() => {
        const commonProps = {
            onNotePlayed: () => {},
            correctNotes: feedback?.correct ? [feedback.note] : [],
            incorrectNote: feedback && !feedback.correct ? feedback.note : null,
            drillMode: settings.drillMode, quizPhase,
            highlightedNotes: currentNote ? [currentNote] : [],
            revealedNoteNames: revealedNotes
        };
        switch (settings.instrument) {
            case 'Piano': return <Piano {...commonProps} range={{ startMidi: 36, keyCount: 61 }} />;
            case 'Guitar': case 'Bass': return <Fretboard {...commonProps} instrument={settings.instrument} handedness={settings.handedness} labelMode="notes" scale={null} />;
            default: return null;
        }
    }, [feedback, settings, quizPhase, currentNote, revealedNotes]);

    return (
        <div className="relative z-10 flex flex-col w-full h-full">
            {feedbackBadge && <FeedbackBadge key={feedbackBadge.id} text={feedbackBadge.text} />}
            <div className={`vignette-overlay ${isDanger ? 'vignette-danger' : ''}`} style={{ '--opacity': vignetteOpacity } as React.CSSProperties}></div>
            <div className="rhythm-bar" style={{ animationDuration: `${60 / currentBpm}s`, display: quizPhase === 'active' ? 'block' : 'none' }}></div>
            
            <header className="grid grid-cols-3 items-center text-stone-300 flex-shrink-0">
                <div className="flex items-center gap-4">
                     <div className={`text-2xl sm:text-3xl font-bold relative ${beats <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                        {beats}<span className="text-sm sm:text-base font-normal text-stone-400 ml-1">Beats</span>
                        {scoreChange && <span key={scoreChange.id} className={`absolute -top-6 right-0 text-xl sm:text-2xl font-bold animate-float-up ${scoreChange.value > 0 ? 'text-green-400' : 'text-red-500'}`}>{scoreChange.value > 0 ? `+${scoreChange.value}` : scoreChange.value}</span>}
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <div className="font-bold text-lg text-stone-100">Level {level}</div>
                    <div className={`text-xs h-4 ${levelUpAnimation ? 'animate-level-up text-yellow-300 font-bold' : ''}`}>
                        {levelUpAnimation ? 'Level Up!' : `${mastered.size}/12 Mastered`}
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4">
                     <div className="text-center">
                        <div className="font-bold text-lg sm:text-xl text-fuchsia-400">{currentBpm}</div>
                        <div className="text-xs">BPM</div>
                    </div>
                    <button onClick={() => { onQuit(); playUIClick(); }} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><QuitIcon className="h-5 w-5" /></button>
                </div>
            </header>
            
            <div className="drill-layout flex-1 flex flex-col lg:flex-row gap-4 min-h-0 mt-4">
                 <div className="instrument-panel relative flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 lg:order-1 overflow-hidden rounded-lg">
                    <WarpSpeedBackground bpm={currentBpm} />
                    <div className="relative z-10 w-full flex-1 flex items-center justify-center">{renderedInstrument}</div>
                </div>
                <div className="question-panel flex flex-col gap-4 lg:w-1/3 lg:max-w-sm lg:order-2">
                    <div className="prompt-container text-center p-4 rounded-lg bg-black/30 flex-1 flex flex-col justify-center">
                        <p className="text-2xl font-semibold text-stone-100">What note is this?</p>
                        <div className="text-xs text-stone-400 mt-4 space-y-2">
                            <p>Correct answers add beats. Wrong answers subtract them.</p>
                            <p>Goal: Master all 12 notes to level up. Beat Level 10 to win!</p>
                        </div>
                    </div>
                     <div className="actions-container grid grid-cols-2 gap-2">
                        {mcqOptions.map(option => (
                            <button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                disabled={!!feedback}
                                className="py-4 px-2 rounded-lg font-bold text-lg transition-colors duration-200 bg-stone-800 hover:bg-stone-700 text-white disabled:opacity-50"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


/**
 * NoteProfessorDrill: A guided lesson where the correct note is highlighted.
 */
const NoteProfessorDrill: React.FC<DrillComponentProps> = ({ settings, onUpdatePerformance, handleFinish, questions, currentQuestion, goToNextQuestion, onQuit }) => {
    const [incorrectNoteFeedback, setIncorrectNoteFeedback] = useState<string | null>(null);
    const [correctNoteFeedback, setCorrectNoteFeedback] = useState<string | null>(null);
    const { playNote, stopNote } = useSustainedNote(settings.instrument);
    const t = createTranslator(settings.language);

    const handleAnswer = useCallback(async (playedUniqueNote: string) => {
        const playedNoteName = getNoteNameFromUniqueId(playedUniqueNote);
        if (!playedNoteName) return;

        if (correctNoteFeedback || incorrectNoteFeedback) return;

        const isCorrect = currentQuestion.correctAnswers.includes(playedNoteName);
        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: settings.drillMode });
        
        if (isCorrect) {
            await playNote(playedUniqueNote);
            playCorrectSound();
            setCorrectNoteFeedback(playedUniqueNote);

            setTimeout(() => {
                stopNote();
                setCorrectNoteFeedback(null);
                if (currentQuestion.id === questions.length - 1) {
                    handleFinish(true, t('noteMaster'));
                } else {
                    goToNextQuestion();
                }
            }, 500);
        } else {
            playIncorrectSound();
            playVibration(VIBRATION_PATTERNS.INCORRECT);
            setIncorrectNoteFeedback(playedUniqueNote);
            setTimeout(() => {
                setIncorrectNoteFeedback(null);
            }, 500);
        }
    }, [currentQuestion, onUpdatePerformance, settings.drillMode, questions, handleFinish, goToNextQuestion, playNote, stopNote, t, correctNoteFeedback, incorrectNoteFeedback]);

    const handleAnswerWithSound = useCallback(async (noteId: string) => {
        if (settings.inputMethod === 'Touch') {
            await playNoteSound(noteId, settings.instrument);
        }
        await handleAnswer(noteId);
    }, [handleAnswer, settings.inputMethod, settings.instrument]);
    
    useMidi(settings.inputMethod === 'MIDI', handleAnswer);
    useAudioPitch(settings.inputMethod === 'Mic', handleAnswer, settings.audioInputDeviceId, settings.micSensitivity, settings.micGain, settings.micCompressionThreshold, settings.micCompressionRatio);

    const renderedInstrument = useMemo(() => {
        const commonProps = {
            onNotePlayed: handleAnswerWithSound,
            highlightedNotes: currentQuestion.correctAnswers,
            correctNotes: correctNoteFeedback ? [correctNoteFeedback] : [],
            incorrectNote: incorrectNoteFeedback,
            scale: null,
            drillMode: settings.drillMode,
        };

        switch (settings.instrument) {
            case 'Piano': return <Piano {...commonProps} range={{ startMidi: 36, keyCount: 61 }} />;
            case 'Guitar': case 'Bass':
                return <Fretboard {...commonProps} instrument={settings.instrument} handedness={settings.handedness} labelMode="notes" />;
            default: return null;
        }
    }, [handleAnswerWithSound, correctNoteFeedback, incorrectNoteFeedback, settings, currentQuestion.correctAnswers]);

    return (
        <div className="flex flex-col w-full h-full gap-2 sm:gap-4">
            <header className="grid grid-cols-3 items-center text-stone-300 flex-shrink-0">
                <div className="font-bold text-base sm:text-lg text-stone-100">
                    {currentQuestion.id + 1} / {questions.length}
                </div>
                <div className="text-center">
                    <div className={`font-bold text-lg sm:text-xl text-fuchsia-400`}>{settings.bpm > 0 ? settings.bpm : '--'}</div>
                    <div className="text-xs">BPM</div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => { onQuit(); playUIClick(); }} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><QuitIcon className="h-5 w-5" /></button>
                </div>
            </header>
            <div className="drill-layout flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 min-h-0">
                <div className="instrument-panel relative flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 lg:order-1 overflow-hidden rounded-lg">
                    {renderedInstrument}
                </div>
                <div className="question-panel flex flex-col gap-2 sm:gap-4 lg:w-1/3 lg:max-w-sm lg:order-2">
                    <div className="prompt-container text-center p-2 sm:p-4 rounded-lg border border-transparent bg-black/30 flex-1 flex flex-col justify-center">
                        <h3 className="text-base sm:text-lg font-bold text-stone-300 mb-2 sm:mb-4">{t(settings.drillMode as TKey)}</h3>
                        <p className="text-xl sm:text-2xl font-semibold text-stone-100 min-h-[40px] flex items-center justify-center">
                            {currentQuestion.prompt}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * SimonGame: Handles the 'Simon Memory Game' drill.
 */
const SimonGame: React.FC<DrillComponentProps> = ({ settings, userData, onUpdatePerformance, handleFinish, currentQuestion, onQuit }) => {
    const [sequence, setSequence] = useState<string[]>([]);
    const [playerTurn, setPlayerTurn] = useState(false);
    const [playerSequence, setPlayerSequence] = useState<string[]>([]);
    const [gameState, setGameState] = useState<'memorize' | 'playing' | 'gameover'>('memorize');
    const [level, setLevel] = useState(1);
    const t = createTranslator(settings.language);

    const scaleNotes = useMemo(() => currentQuestion.correctAnswers, [currentQuestion]);

    const addToSequence = useCallback(() => {
        const nextNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        setSequence(prev => [...prev, nextNote]);
    }, [scaleNotes]);

    useEffect(() => {
        if (gameState === 'memorize') {
            setPlayerTurn(false);
            const newSequence = [...sequence];
            const nextNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
            newSequence.push(nextNote);
            setSequence(newSequence);
            
            let delay = 500;
            newSequence.forEach(note => {
                setTimeout(() => playNoteSound(note, 'Piano'), delay);
                delay += 500;
            });

            setTimeout(() => {
                setPlayerTurn(true);
                setGameState('playing');
                setPlayerSequence([]);
            }, delay);
        }
    }, [gameState, scaleNotes]);

    const handleAnswer = useCallback(async (playedUniqueNote: string) => {
        if (!playerTurn || gameState !== 'playing') return;
        
        const playedNoteName = getNoteNameFromUniqueId(playedUniqueNote);
        if (!playedNoteName) return;
        
        await playNoteSound(playedNoteName, 'Piano');
        const newPlayerSequence = [...playerSequence, playedNoteName];
        setPlayerSequence(newPlayerSequence);
        
        const currentIdx = newPlayerSequence.length - 1;
        if (sequence[currentIdx] !== playedNoteName) {
            playIncorrectSound();
            playVibration(VIBRATION_PATTERNS.INCORRECT);
            setGameState('gameover');
            handleFinish(false, t('tryAgain'), level - 1);
            return;
        }

        if (newPlayerSequence.length === sequence.length) {
            playCorrectSound();
            setLevel(l => l + 1);
            setGameState('memorize');
        }
    }, [playerTurn, gameState, playerSequence, sequence, handleFinish, level, t]);

    useMidi(settings.inputMethod === 'MIDI', handleAnswer);
    useAudioPitch(settings.inputMethod === 'Mic', handleAnswer, settings.audioInputDeviceId, settings.micSensitivity, settings.micGain, settings.micCompressionThreshold, settings.micCompressionRatio);

    const renderedInstrument = useMemo(() => (
        <Piano onNotePlayed={handleAnswer} range={{ startMidi: 48, keyCount: 25 }} />
    ), [handleAnswer]);

    const promptText = gameState === 'memorize' ? t('memorizeRound', { level }) : t('playTheSequence', { played: playerSequence.length, total: sequence.length });

    return (
        <div className="flex flex-col w-full h-full items-center justify-start gap-4">
             <header className="w-full grid grid-cols-3 items-center text-stone-300 flex-shrink-0">
                <div className="flex gap-4 justify-start text-sm">
                    <p>{t('score')}: <span className="font-bold text-white">{level - 1}</span></p>
                    <p>{t('high')}: <span className="font-bold text-white">{userData.simonHighScore}</span></p>
                </div>
                <div className="text-center">
                    <div className="font-bold text-lg sm:text-xl text-fuchsia-400">{settings.bpm}</div>
                    <div className="text-xs">BPM</div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => { onQuit(); playUIClick(); }} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><QuitIcon className="h-5 w-5" /></button>
                </div>
            </header>
            <div className="text-center">
                <h3 className="text-2xl font-bold">{t('Simon Memory Game')}</h3>
                <p className="text-lg">{promptText}</p>
            </div>
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
                {renderedInstrument}
            </div>
        </div>
    );
};

/**
 * StandardDrill: Handles all "find the note" style drills.
 * (Practice, Time Attack, BPM Challenge, Nashville, Degrees, Intervals, Chords, Detective, etc.)
 */
const StandardDrill: React.FC<DrillComponentProps> = ({ settings, userData, onQuit, onUpdatePerformance, handleFinish, questions, currentQuestion, goToNextQuestion, quizPhase }) => {
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
    const [feedbackDetails, setFeedbackDetails] = useState<{ status: 'correct' | 'incorrect' | 'found'; playedNote: string | null; correctAnswers: string[] } | null>(null);
    const [feedbackQuestion, setFeedbackQuestion] = useState<Question | null>(null);
    const [scoreChange, setScoreChange] = useState<{ value: number, id: number } | null>(null);
    const [instrumentLabelMode, setInstrumentLabelMode] = useState<InstrumentLabelMode>('notes');
    const [showHelp, setShowHelp] = useState(false);
    
    // Question-specific state
    const [questionPart, setQuestionPart] = useState<'find_note' | 'identify_root'>('find_note');
    const [selectedRootKey, setSelectedRootKey] = useState<MusicKey | null>(null);
    const [foundNotes, setFoundNotes] = useState<string[]>([]);
    const [incorrectNoteFeedback, setIncorrectNoteFeedback] = useState<string | null>(null);
    const [hadMistakeThisQuestion, setHadMistakeThisQuestion] = useState(false);
  
    // Beat system state
    const [beats, setBeats] = useState(settings.totalBeats);
    const [questionBeatTimer, setQuestionBeatTimer] = useState(QUESTION_BEAT_LIMIT);
    const [currentBpm, setCurrentBpm] = useState(settings.bpm);
    const [correctAnswersInLevel, setCorrectAnswersInLevel] = useState(0);
  
    // Visual Effect States
    const [isPerfectPulse, setIsPerfectPulse] = useState(false);
    const [bpmIncreasePulse, setBpmIncreasePulse] = useState(false);

    const { playNote, stopNote } = useSustainedNote(settings.instrument);
    const t = createTranslator(settings.language);

    // Reset for new questions
    useEffect(() => {
        setGameState('playing');
        setFeedbackDetails(null);
        setFeedbackQuestion(null);
        setFoundNotes([]);
        setQuestionPart('find_note');
        setSelectedRootKey(null);
        setHadMistakeThisQuestion(false);
        setQuestionBeatTimer(QUESTION_BEAT_LIMIT);
    }, [currentQuestion]);

    const activeQuestion = feedbackQuestion || currentQuestion;
    const isMultiNoteQuestion = activeQuestion?.correctAnswers.length > 1;

    const scale: Scale | null = useMemo(() => {
        if (!activeQuestion) return null;
        return getScale(activeQuestion.key, activeQuestion.scaleType);
    }, [activeQuestion]);

    const handleSingleNoteCorrect = useCallback(() => {
        const isPerfect = !hadMistakeThisQuestion && questionBeatTimer > (QUESTION_BEAT_LIMIT / 2);
        const beatAward = isPerfect ? settings.beatAward * 2 : settings.beatAward;

        if (isPerfect) {
            setIsPerfectPulse(true);
            setTimeout(() => setIsPerfectPulse(false), 1500);
        }
        
        playCorrectSound();
        setScore(s => s + 1);
        setBeats(b => b + beatAward);
        setScoreChange({ value: beatAward, id: Date.now() });
        
        const newCorrectCount = correctAnswersInLevel + 1;
        setCorrectAnswersInLevel(newCorrectCount);

        if (settings.drillMode === 'BPM Challenge' && newCorrectCount > 0 && newCorrectCount % BPM_INCREASE_THRESHOLD === 0) {
            setCurrentBpm(bpm => bpm + BPM_INCREMENT);
            setBpmIncreasePulse(true);
            setTimeout(() => setBpmIncreasePulse(false), 1000);
        }
    }, [settings, hadMistakeThisQuestion, questionBeatTimer, correctAnswersInLevel]);

    const handleSingleNoteIncorrect = useCallback(() => {
        stopNote();
        playIncorrectSound();
        playVibration(VIBRATION_PATTERNS.INCORRECT);
        setBeats(b => Math.max(0, b - settings.beatPenalty));
        setScoreChange({ value: -settings.beatPenalty, id: Date.now() });
        setHadMistakeThisQuestion(true);
    }, [settings.beatPenalty, stopNote]);

    const showFeedbackAndMoveNext = useCallback((isCorrect: boolean, playedUniqueNote: string) => {
        setFeedbackQuestion(currentQuestion);
        setGameState('feedback');
        setFeedbackDetails({ status: isCorrect ? 'correct' : 'incorrect', playedNote: playedUniqueNote, correctAnswers: getUniqueAnswersForQuestion(currentQuestion) });
        setTimeout(() => goToNextQuestion(), 1500);
    }, [currentQuestion, goToNextQuestion]);

    const handleStandardAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        const answers = getUniqueAnswersForQuestion(currentQuestion);
        const areAnswersOctaveSpecific = answers.length > 0 && /\d/.test(answers[0]);
        const isCorrect = areAnswersOctaveSpecific
            ? answers.includes(playedUniqueNote)
            : answers.includes(playedNoteName);
            
        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: settings.drillMode });

        if (isCorrect) handleSingleNoteCorrect();
        else handleSingleNoteIncorrect();
        
        showFeedbackAndMoveNext(isCorrect, playedUniqueNote);
    }, [currentQuestion, onUpdatePerformance, settings.drillMode, handleSingleNoteCorrect, handleSingleNoteIncorrect, showFeedbackAndMoveNext]);

    const handleMultiNoteAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        if (incorrectNoteFeedback) return;
        
        const expectedAnswers = getUniqueAnswersForQuestion(currentQuestion);
        const areAnswersOctaveSpecific = expectedAnswers.length > 0 && /\d/.test(expectedAnswers[0]);
        const isCorrectNote = areAnswersOctaveSpecific ? expectedAnswers.includes(playedUniqueNote) : expectedAnswers.includes(playedNoteName);

        if (isCorrectNote) {
            const noteToAdd = areAnswersOctaveSpecific ? playedUniqueNote : playedNoteName;
            if (foundNotes.includes(noteToAdd)) return;

            const newFoundNotes = [...foundNotes, noteToAdd];
            setFoundNotes(newFoundNotes);
            playCorrectSound();
            
            if (new Set(newFoundNotes).size === new Set(expectedAnswers).size) {
                onUpdatePerformance({ ...currentQuestion, isCorrect: !hadMistakeThisQuestion, drillMode: settings.drillMode });
                handleSingleNoteCorrect();
                showFeedbackAndMoveNext(true, playedUniqueNote);
            }
        } else {
            setIncorrectNoteFeedback(playedUniqueNote);
            setTimeout(() => setIncorrectNoteFeedback(null), 500);
            handleSingleNoteIncorrect();
        }
    }, [incorrectNoteFeedback, currentQuestion, foundNotes, onUpdatePerformance, hadMistakeThisQuestion, settings.drillMode, handleSingleNoteCorrect, showFeedbackAndMoveNext, handleSingleNoteIncorrect]);
    
    const handleScaleDetectiveAnswer = useCallback((playedUniqueNote: string) => {
        if (questionPart !== 'find_note') return;

        const answers = getUniqueAnswersForQuestion(currentQuestion);
        const isCorrect = answers.includes(playedUniqueNote);

        setFeedbackQuestion(currentQuestion);
        setGameState('feedback');
        if (isCorrect) {
            playCorrectSound();
            setFoundNotes([playedUniqueNote]);
            setFeedbackDetails({ status: 'found', playedNote: playedUniqueNote, correctAnswers: answers });
            setTimeout(() => {
                setQuestionPart('identify_root');
                setFeedbackDetails(null);
                setFeedbackQuestion(null);
                setGameState('playing');
                setQuestionBeatTimer(QUESTION_BEAT_LIMIT);
            }, 1000);
        } else {
            handleSingleNoteIncorrect();
            setFeedbackDetails({ status: 'incorrect', playedNote: playedUniqueNote, correctAnswers: answers });
            setTimeout(() => {
                setGameState('playing');
                setFeedbackDetails(null);
                setFeedbackQuestion(null);
                setQuestionBeatTimer(QUESTION_BEAT_LIMIT);
            }, 1000);
        }
    }, [questionPart, currentQuestion, handleSingleNoteIncorrect]);

    const handleRootKeySelection = useCallback((selectedKey: MusicKey) => {
        if (gameState !== 'playing' || questionPart !== 'identify_root') return;
        
        setSelectedRootKey(selectedKey);
        const isCorrect = selectedKey === currentQuestion.key;
        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: settings.drillMode });
        stopNote();

        if (isCorrect) {
            setScore(s => s + 1);
            setBeats(b => b + settings.beatAward);
            setScoreChange({ value: settings.beatAward, id: Date.now() });
            playCorrectSound();
        } else {
            setBeats(b => Math.max(0, b - settings.beatPenalty));
            setScoreChange({ value: -settings.beatPenalty, id: Date.now() });
            playIncorrectSound();
            playVibration(VIBRATION_PATTERNS.INCORRECT);
        }
        setFeedbackDetails({ status: isCorrect ? 'correct' : 'incorrect', playedNote: null, correctAnswers: getUniqueAnswersForQuestion(currentQuestion) });
        setFeedbackQuestion(currentQuestion);
        setGameState('feedback');
        setTimeout(() => goToNextQuestion(), 1500);
    }, [gameState, currentQuestion, questionPart, onUpdatePerformance, settings, goToNextQuestion, stopNote]);

    const handleAnswer = useCallback(async (playedUniqueNote: string) => {
        if (gameState !== 'playing' || quizPhase !== 'active') return;
        
        const playedNoteName = getNoteNameFromUniqueId(playedUniqueNote);
        if (!playedNoteName) return;
        
        await playNote(playedUniqueNote);

        if (settings.drillMode === 'Scale Detective') handleScaleDetectiveAnswer(playedUniqueNote);
        else if (isMultiNoteQuestion) handleMultiNoteAnswer(playedUniqueNote, playedNoteName);
        else handleStandardAnswer(playedUniqueNote, playedNoteName);
    }, [gameState, quizPhase, settings.drillMode, isMultiNoteQuestion, playNote, handleScaleDetectiveAnswer, handleMultiNoteAnswer, handleStandardAnswer]);

    const handleAnswerWithSound = useCallback(async (playedUniqueNote: string) => {
        if (settings.inputMethod === 'Touch') {
            await playNoteSound(playedUniqueNote, settings.instrument);
        }
        await handleAnswer(playedUniqueNote);
    }, [handleAnswer, settings.inputMethod, settings.instrument]);
    
    useMidi(settings.inputMethod === 'MIDI', handleAnswer);
    useAudioPitch(settings.inputMethod === 'Mic', handleAnswer, settings.audioInputDeviceId, settings.micSensitivity, settings.micGain, settings.micCompressionThreshold, settings.micCompressionRatio);

    // BPM Timer
    useEffect(() => {
        if (gameState !== 'playing' || quizPhase !== 'active' || currentBpm === 0) return;
        const intervalTime = (60 / currentBpm) * 1000;
        const interval = setInterval(() => {
            playVibration(VIBRATION_PATTERNS.TICK);
            setBeats(b => {
                if (b - 1 <= 0) {
                    clearInterval(interval);
                    handleFinish(false, undefined, score);
                    return 0;
                }
                return b - 1;
            });
            
            setQuestionBeatTimer(t => {
                if (t - 1 <= 0) {
                    // Handle timeout logic
                    return QUESTION_BEAT_LIMIT;
                }
                return t - 1;
            });
        }, intervalTime);
        return () => clearInterval(interval);
    }, [gameState, quizPhase, currentBpm, handleFinish, score]);

    const healthPercent = (beats / settings.totalBeats) * 100;
    const isDanger = healthPercent < 25;
    const vignetteOpacity = healthPercent < 60 ? (1 - (healthPercent / 60)) * 0.8 : 0;
    
    const renderedInstrument = useMemo(() => {
        let correctNotes: string[] = [];
        let highlightedNotes: string[] = [];
        
        if (showHelp && scale) highlightedNotes.push(...scale.notes);
        if (isMultiNoteQuestion) correctNotes.push(...foundNotes);
        
        if (gameState === 'feedback' && feedbackDetails) {
            correctNotes.push(...feedbackDetails.correctAnswers);
        }

        if (settings.drillMode === 'Scale Detective' && activeQuestion?.contextNotes) {
            const isShowingFullScale = questionPart === 'identify_root' || (gameState === 'feedback' && feedbackDetails?.status === 'correct');
            const contextUnique = getUniqueAnswersForQuestion({ ...activeQuestion, correctAnswers: activeQuestion.contextNotes as Note[] });
            if (isShowingFullScale) {
                const allScaleNotes = getUniqueAnswersForQuestion({ ...activeQuestion, correctAnswers: [...activeQuestion.contextNotes, ...activeQuestion.correctAnswers] as Note[] });
                correctNotes.push(...allScaleNotes);
            } else {
                highlightedNotes.push(...contextUnique);
                if (feedbackDetails?.status === 'found' && feedbackDetails.playedNote) {
                     correctNotes.push(feedbackDetails.playedNote);
                }
            }
        }
        
        const commonProps = {
          onNotePlayed: handleAnswerWithSound,
          highlightedNotes: [...new Set(highlightedNotes)],
          correctNotes: [...new Set(correctNotes)],
          incorrectNote: incorrectNoteFeedback || (feedbackDetails?.status === 'incorrect' ? feedbackDetails.playedNote : null),
          labelMode: instrumentLabelMode,
          scale,
        };
        switch (settings.instrument) {
          case 'Piano': return <Piano {...commonProps} range={{ startMidi: 36, keyCount: 61 }} />;
          case 'Guitar':
          case 'Bass': return <Fretboard instrument={settings.instrument} {...commonProps} handedness={settings.handedness} />;
          default: return null;
        }
    }, [handleAnswerWithSound, incorrectNoteFeedback, showHelp, scale, gameState, isMultiNoteQuestion, foundNotes, feedbackDetails, settings, activeQuestion, questionPart, instrumentLabelMode]);

    const feedbackClass = gameState !== 'feedback' ? 'bg-black/30 border-transparent' : 
    (feedbackDetails?.status === 'correct' ? 'bg-green-500/20 border-green-500' : 
     feedbackDetails?.status === 'found' ? 'bg-sky-500/20 border-sky-500' : 
     'bg-red-500/20 border-red-500');

    return (
        <div className="relative z-10 flex flex-col w-full h-full">
            {currentBpm > 0 && <div className="rhythm-bar" style={{ animationDuration: `${60 / currentBpm}s` }}></div>}
            <div className={`vignette-overlay ${isDanger ? 'vignette-danger' : ''}`} style={{ '--opacity': vignetteOpacity } as React.CSSProperties}></div>
            {showHelp && scale && <HelpModal scale={scale} onClose={() => setShowHelp(false)} />}
            
            <header className="grid grid-cols-3 items-center text-stone-300 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-base sm:text-lg text-stone-100">Score: {score}</div>
                    <div className={`text-2xl sm:text-3xl font-bold relative ${beats <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                        {beats}<span className="text-sm sm:text-base font-normal text-stone-400 ml-1">Beats</span>
                        {scoreChange && <span key={scoreChange.id} className={`absolute -top-6 right-0 text-xl sm:text-2xl font-bold animate-float-up ${scoreChange.value > 0 ? 'text-green-400' : 'text-red-500'}`}>{scoreChange.value > 0 ? `+${scoreChange.value}` : scoreChange.value}</span>}
                    </div>
                </div>
                <div className="text-center">
                    <div className={`font-bold text-lg sm:text-xl text-fuchsia-400 transition-all duration-500 ${bpmIncreasePulse ? 'animate-bpm-pulse' : ''}`}>{currentBpm > 0 ? currentBpm : '--'}</div>
                    <div className="text-xs">BPM</div>
                </div>
                <div className="flex gap-1 sm:gap-2 justify-end">
                    <button onClick={() => { setShowHelp(true); playUIClick(); }} title="Help" className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-full"><HelpIcon className="h-5 w-5" /></button>
                    <button onClick={() => { setInstrumentLabelMode(p => p === 'notes' ? 'degrees' : 'notes'); playUIClick(); }} title="Toggle Note/Degree Labels" className={`p-2 rounded-full transition-colors ${instrumentLabelMode === 'degrees' ? 'bg-orange-500 text-white' : 'bg-stone-600 hover:bg-stone-500 text-stone-200'}`}><ToggleDegreesIcon className="h-5 w-5" /></button>
                    <button onClick={() => { onQuit(); playUIClick(); }} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><QuitIcon className="h-5 w-5" /></button>
                </div>
            </header>

            <div className="drill-layout flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 min-h-0 mt-2 sm:mt-4">
                <div className="instrument-panel relative flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 lg:order-1 overflow-hidden rounded-lg">
                    {currentBpm > 0 && <WarpSpeedBackground bpm={currentBpm} />}
                    <div className="relative z-10 w-full flex-1 flex items-center justify-center">{renderedInstrument}</div>
                </div>

                <div className="question-panel flex flex-col gap-2 sm:gap-4 lg:w-1/3 lg:max-w-sm lg:order-2">
                    <div className={`prompt-container text-center p-2 sm:p-4 rounded-lg border transition-colors duration-300 relative overflow-hidden flex-1 flex flex-col justify-center ${feedbackClass}`}>
                        <h3 className="text-base sm:text-lg font-bold text-stone-300 mb-2 sm:mb-4">{t(settings.drillMode as TKey)}</h3>
                        <p className={`text-xl sm:text-2xl font-semibold text-stone-100 min-h-[40px] flex items-center justify-center transition-all duration-500 ${isPerfectPulse ? 'animate-perfect-pulse' : ''}`}>{activeQuestion.prompt}</p>
                        {isMultiNoteQuestion && gameState === 'playing' && <div className="text-sm text-stone-300 mt-2">Found {foundNotes.length} of {activeQuestion.correctAnswers.length}</div>}
                    </div>
                    {settings.drillMode === 'Scale Detective' && questionPart === 'identify_root' && gameState === 'playing' && (
                        <div className="actions-container grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-3 gap-1 sm:gap-2">
                            {MUSIC_KEYS.map(key => <button key={key} onClick={() => { handleRootKeySelection(key); playUIClick(); }} className="py-2 sm:py-3 px-2 rounded-md font-semibold transition-colors duration-200 bg-stone-800 hover:bg-stone-700 text-white">{key}</button>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * GalaxyConstructorDrill: Wrapper for the GalaxyConstructor view component.
 */
const GalaxyConstructorDrill: React.FC<DrillComponentProps> = ({ settings, onUpdatePerformance, handleFinish, currentQuestion, goToNextQuestion, onQuit }) => {
    const scale = useMemo(() => getScale(currentQuestion.key, currentQuestion.scaleType), [currentQuestion]);
    const correctIntervalSequence = useMemo(() => getIntervalSequenceForScale(currentQuestion.scaleType), [currentQuestion.scaleType]);
    
    const [builtIntervals, setBuiltIntervals] = useState<string[]>([]);
    
    const handleIntervalSelection = (selectedInterval: string) => {
        playUIClick();
        const nextCorrectInterval = correctIntervalSequence[builtIntervals.length];
        const isCorrect = selectedInterval === nextCorrectInterval;

        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: settings.drillMode });

        if (isCorrect) {
            playCorrectSound();
            const newBuiltIntervals = [...builtIntervals, selectedInterval];
            setBuiltIntervals(newBuiltIntervals);
            if (newBuiltIntervals.length === correctIntervalSequence.length) {
                setTimeout(() => handleFinish(true), 500);
            }
        } else {
            playIncorrectSound();
            playVibration(VIBRATION_PATTERNS.INCORRECT);
        }
    };
    
    // Simple interval choices for this drill
    const intervalChoices = ["Major 2nd", "Minor 2nd"];

    return (
        <div className="w-full h-full flex flex-col">
            <header className="w-full grid grid-cols-3 items-center text-stone-300 flex-shrink-0 mb-2">
                <div></div> {/* Left placeholder */}
                <div className="text-center">
                    <div className="font-bold text-lg sm:text-xl text-fuchsia-400">{settings.bpm > 0 ? settings.bpm : '--'}</div>
                    <div className="text-xs">BPM</div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => { onQuit(); playUIClick(); }} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><QuitIcon className="h-5 w-5" /></button>
                </div>
            </header>
            <GalaxyConstructor 
                scale={scale} 
                builtIntervals={builtIntervals} 
                intervalChoices={intervalChoices} 
                onSelectInterval={handleIntervalSelection}
            />
        </div>
    );
};

/**
 * DegreeDashDrill: Wrapper for the DegreeDash view component.
 */
const DegreeDashDrill: React.FC<DrillComponentProps> = ({ settings, onUpdatePerformance, handleFinish, currentQuestion, goToNextQuestion, onQuit }) => {
    const scale = useMemo(() => getScale(currentQuestion.key, currentQuestion.scaleType), [currentQuestion]);
    const [round, setRound] = useState(1);
    const [phase, setPhase] = useState<DegreeDashPhase>('fill_in');
    const [lives, setLives] = useState(3);
    const [timer, setTimer] = useState(50);
    const t = createTranslator(settings.language);

    useEffect(() => {
        if (phase !== 'timed_finale') return;

        const interval = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    clearInterval(interval);
                    handleFinish(false, t('tryAgain'), round - 1);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase, handleFinish, round, t]);

    const handlePlacement = (isCorrect: boolean) => {
        if (!isCorrect) {
            playIncorrectSound();
            playVibration(VIBRATION_PATTERNS.INCORRECT);
            if (lives - 1 <= 0) {
                setLives(0);
                handleFinish(false, t('tryAgain'), round - 1);
            } else {
                setLives(l => l - 1);
            }
        } else {
            playCorrectSound();
        }
    };
    
    const handleRoundComplete = () => {
        playCorrectSound();
        setPhase('intermission');
        setTimeout(() => {
            if (round >= 5) {
                setRound(6);
                setPhase('timed_finale');
                setTimer(50); // Reset timer for finale
            } else {
                setRound(r => r + 1);
                setPhase('fill_in');
                goToNextQuestion(); // Get a new key for the next round
            }
        }, 1500);
    };

    return (
      <div className="flex flex-col w-full h-full">
          <header className="flex justify-between items-center text-stone-300 flex-shrink-0">
              <div className="font-bold text-lg text-stone-100">{t('round')} {round > 5 ? 'Finale' : `${round}/5`}</div>
              
              <div className="text-center">
                  <div className="font-bold text-lg sm:text-xl text-fuchsia-400">{settings.bpm > 0 ? settings.bpm : '--'}</div>
                  <div className="text-xs">BPM</div>
              </div>

              <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${phase === 'timed_finale' ? 'text-red-500' : 'text-orange-400'}`}>
                      {phase === 'timed_finale' ? timer : `${lives} ❤️`}
                  </div>
                  <button onClick={() => { onQuit(); playUIClick(); }} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><QuitIcon className="h-5 w-5" /></button>
              </div>
          </header>
          <DegreeDash 
              scale={scale} 
              instrumentSettings={{ instrument: settings.instrument, handedness: settings.handedness }}
              phase={phase}
              round={round}
              disableHints={settings.drillMode === 'Degree Dash Pro'}
              onUpdatePerformance={onUpdatePerformance}
              onPlacement={handlePlacement}
              onRoundComplete={handleRoundComplete}
          />
      </div>
    );
};

// ====================================================================================
// MAIN QUIZ CONTROLLER COMPONENT
// ====================================================================================

const Quiz: React.FC<QuizProps> = (props) => {
  const { settings, userData, onQuit, onDrillComplete, onToggleSkipPreDrillInfo } = props;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('loading');
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);

  const t = createTranslator(settings.language);

  const handleFinish = useCallback((success: boolean, customMessage?: string, scoreOverride?: number | string) => {
    let finalMessage = success ? (customMessage || t('drillComplete')) : t('beatsDropped');
    let finalScore = scoreOverride ?? currentQuestionIndex;
    let totalQuestions = questions.length;

    let metricLabel = t('correct');
    if (['Key Conjurer', 'Note Professor'].includes(settings.drillMode)) metricLabel = t('notesLearned');
    if (['ScaleSweeper'].includes(settings.drillMode)) metricLabel = t('scalesSwept');
    if (['Galaxy Constructor'].includes(settings.drillMode)) metricLabel = t('galaxiesBuilt');
    if (['Degree Dash', 'Degree Dash Pro', 'Simon Memory Game'].includes(settings.drillMode)) metricLabel = t('roundsCleared');
    if (settings.drillMode === 'Key Conjurer') metricLabel = t('level');
    
    setCompletionData({
        success,
        score: typeof finalScore === 'number' ? finalScore : 0,
        totalQuestions,
        finalMessage,
        completionMetric: { value: finalScore, label: metricLabel }
    });
    setQuizPhase('finished');
    onDrillComplete({ score: typeof finalScore === 'number' ? finalScore : 0, totalQuestions, level: settings.level, success, drillMode: settings.drillMode });
  }, [questions.length, settings.level, settings.drillMode, onDrillComplete, t, currentQuestionIndex]);

  const goToNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
        if (['Scale Detective', 'Note Professor'].includes(settings.drillMode)) {
            handleFinish(true);
        } else {
             handleFinish(true, "You've exhausted all the questions! Amazing!");
        }
    } else {
        setCurrentQuestionIndex(nextIndex);
    }
  }, [currentQuestionIndex, questions.length, settings.drillMode, handleFinish]);
  
  const handleTryAgain = useCallback(() => {
    playUIClick();
    let generatedQuestions = generateDrillQuestions(settings, userData.performance);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    
    // If it's the Key Conjurer drill, always show the info screen.
    // For other drills, respect the user's "skip" preference.
    if (settings.drillMode === 'Key Conjurer') {
      setQuizPhase('info');
    } else {
      setQuizPhase(userData.preDrillInfoSeen[settings.drillMode] ? 'countdown' : 'info');
    }

    setCompletionData(null);
  }, [settings, userData]);

  // Initial setup effect
  useEffect(() => {
    // This initialization logic runs only when the `settings` prop changes,
    // preventing the drill from resetting on every answer (which updates userData).
    let generatedQuestions = generateDrillQuestions(settings, userData.performance);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    
    if (settings.drillMode === 'Key Conjurer') {
      setQuizPhase('info');
    } else {
      setQuizPhase(userData.preDrillInfoSeen[settings.drillMode] ? 'countdown' : 'info');
    }
    setCompletionData(null);
  }, [settings]);

  if (quizPhase === 'loading' || questions.length === 0) {
    return <div className="text-center p-8">Loading drill...</div>;
  }
  
  if (quizPhase === 'info') {
    return <PreQuizInfo drillMode={settings.drillMode} onReady={() => setQuizPhase('countdown')} onSkipChange={(skip) => onToggleSkipPreDrillInfo(settings.drillMode, skip)} language={settings.language} />;
  }

  if (quizPhase === 'countdown' || quizPhase === 'intermission') {
    return <Countdown onComplete={() => setQuizPhase('active')} />;
  }
  
  if (quizPhase === 'transition') {
      return <Countdown message="Get Ready!" onComplete={() => setQuizPhase('active')} />;
  }
  
  if (quizPhase === 'finished' && completionData) {
    return (
      <div className="bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-8 rounded-xl text-center shadow-2xl w-full max-w-md">
        <h2 className={`text-3xl font-bold mb-2 ${completionData.success ? 'text-green-400' : 'text-red-500'}`}>{completionData.finalMessage}</h2>
        {completionData.completionMetric && (
          <div className="text-xl mb-4 text-stone-200">{`Score: `}<span className="text-orange-400 font-bold">{completionData.completionMetric.value}</span> {completionData.completionMetric.label}</div>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button onClick={handleTryAgain} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg">Try Again</button>
            <button onClick={onQuit} className="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-6 rounded-lg">Main Menu</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const drillProps = { ...props, quizPhase, setQuizPhase, handleFinish, questions, currentQuestion, goToNextQuestion };

  const renderDrill = () => {
    switch (settings.drillMode) {
        case 'Key Conjurer':
            return <KeyConjurerDrill {...drillProps} />;
        case 'Note Professor':
            return <NoteProfessorDrill {...drillProps} />;
        case 'Simon Memory Game':
            return <SimonGame {...drillProps} />;
        case 'Galaxy Constructor':
            return <GalaxyConstructorDrill {...drillProps} />;
        case 'Degree Dash':
        case 'Degree Dash Pro':
            return <DegreeDashDrill {...drillProps} />;
        // `ScaleSweeper` could have its own component, but its logic fits well in StandardDrill for now
        // under the multi-note question type. If it becomes more complex, it can be broken out.
        default:
            return <StandardDrill {...drillProps} />;
    }
  }

  return (
    <div className={`bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-2 sm:p-4 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden`}>
      {renderDrill()}
    </div>
  );
};

export default Quiz;
