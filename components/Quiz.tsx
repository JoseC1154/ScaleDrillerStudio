import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { DrillSettings, Note, Question, Scale, MusicKey, UserData, PerformanceUpdate, DrillMode, FretboardNote, DrillCompletionResult, SweeperPhase, NoteDiscoveryRound, ScaleType, QuizPhase, DegreeDashPhase, Key } from '../types';
import { generateDrillQuestions, getScale, getUniqueAnswersForQuestion, getFretboardNotes, getDegreeFromNote, getIntervalSequenceForScale } from '../services/music';
import { useMidi } from '../hooks/useMidi';
import { useAudioPitch } from '../hooks/useAudioPitch';
import Piano from './Piano';
import Fretboard from './Fretboard';
import HelpModal from './HelpModal';
import { MUSIC_KEYS, ALL_NOTES, GUITAR_TUNING, BASS_TUNING, DEGREE_NAMES, INTERVALS, INTERVAL_NAMES, SCALE_TYPES } from '../constants';
import PreQuizInfo from './PreQuizInfo';
import Countdown from './Countdown';
import { playNoteSound } from '../services/sound';
import { HelpIcon, ToggleDegreesIcon, QuitIcon, HeartIcon } from './Icons';
import { useScrollToElement } from '../hooks/useScrollToElement';
import GalaxyConstructor from './GalaxyConstructor';
import { playVibration, VIBRATION_PATTERNS } from '../services/haptics';
import { useSustainedNote } from '../hooks/useSustainedNote';
import WarpSpeedBackground from './WarpSpeedBackground';
import DegreeSelector from './DegreeSelector';
import DegreeDash from './DegreeDash';

interface QuizProps {
  settings: DrillSettings;
  onQuit: () => void;
  userData: UserData;
  onUpdatePerformance: (update: PerformanceUpdate) => void;
  onDrillComplete: (result: DrillCompletionResult) => void;
  onToggleSkipPreDrillInfo: (drillMode: DrillMode, skip: boolean) => void;
}

type InstrumentLabelMode = 'notes' | 'degrees';
type QuestionPart = 'find_note' | 'identify_root';
type GameState = 'playing' | 'feedback' | 'finished' | 'memory_display';


interface FeedbackDetails {
    status: 'correct' | 'incorrect' | 'found';
    playedNote: string | null;
    correctAnswers: string[]; // Changed to string to handle unique IDs and note names
}

interface CompletionData {
    success: boolean;
    score: number;
    totalQuestions: number;
    finalMessage: string;
    unlockedItem: string | null;
    memoryLevel?: number;
    bpmLevel?: number;
    isNewHighScore?: boolean;
    accuracy?: number;
    maxStreak?: number;
    avgResponseTime?: number;
}

const QUESTION_BEAT_LIMIT = 10;
const MAX_MEMORY_LEVEL = 8;
const BPM_INCREASE_THRESHOLD = 10; // Increase BPM every 10 correct answers in applicable modes
const BPM_INCREMENT = 10;

const NOTE_DISCOVERY_ROUNDS_CONFIG: Record<number, { cycles: number; hidden: number; penalty: number; bpm: number; beats: number; beatAward: number; }> = {
  1: { cycles: 2, hidden: 0, penalty: 0, bpm: 0, beats: 999, beatAward: 0 },
  2: { cycles: 3, hidden: 1, penalty: 1, bpm: 80, beats: 80, beatAward: 3 },
  3: { cycles: 3, hidden: 2, penalty: 1, bpm: 90, beats: 70, beatAward: 3 },
  4: { cycles: 4, hidden: 4, penalty: 2, bpm: 100, beats: 60, beatAward: 4 },
  5: { cycles: 4, hidden: 6, penalty: 2, bpm: 115, beats: 50, beatAward: 5 },
};

// Helper to convert note ID to a sortable number (MIDI-like)
const uniqueIdToSortable = (id: string): number => {
    if (id.includes('-')) { // Fretboard e.g. "C-0-5"
        const [, s, f] = id.split('-');
        // Prioritize string, then fret for a standard layout sort
        return parseInt(s, 10) * 100 + parseInt(f, 10);
    } else { // Piano e.g. "C4"
        const match = id.match(/([A-G][b#]?)(-?\d+)/);
        if (!match) return 0;
        const [, noteName, octaveStr] = match;
        const octave = parseInt(octaveStr, 10);
        const noteIndex = ALL_NOTES.indexOf(noteName as Note);
        // Standard MIDI number calculation
        return (octave + 1) * 12 + noteIndex;
    }
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateNoteDiscoveryQuestions = (round: number): Question[] => {
    const config = NOTE_DISCOVERY_ROUNDS_CONFIG[round as NoteDiscoveryRound];
    if (!config) return [];

    let allQuestionNotes: Note[] = [];
    let lastNote: Note | null = null;

    for (let i = 0; i < config.cycles; i++) {
        let cycleNotes = shuffleArray([...ALL_NOTES]);

        // Prevent first note of cycle from being same as last note of previous cycle
        if (lastNote && cycleNotes[0] === lastNote && cycleNotes.length > 1) {
            const temp = cycleNotes[0];
            cycleNotes[0] = cycleNotes[1];
            cycleNotes[1] = temp;
        }
        
        allQuestionNotes.push(...cycleNotes);
        lastNote = cycleNotes[cycleNotes.length - 1];
    }
    
    // Prevent back-to-back notes across the entire generated sequence
    for (let i = 1; i < allQuestionNotes.length; i++) {
        if (allQuestionNotes[i] === allQuestionNotes[i-1]) {
            let swapIndex = i + 1;
            if (swapIndex >= allQuestionNotes.length) {
                swapIndex = i - 2; // Look backwards if at the end
            }
            if (swapIndex >= 0 && swapIndex < allQuestionNotes.length) {
                 if(allQuestionNotes[swapIndex] !== allQuestionNotes[i-1] && (i + 1 >= allQuestionNotes.length || allQuestionNotes[swapIndex] !== allQuestionNotes[i+1])) {
                    const temp = allQuestionNotes[i];
                    allQuestionNotes[i] = allQuestionNotes[swapIndex];
                    allQuestionNotes[swapIndex] = temp;
                 }
            }
        }
    }
    
    return allQuestionNotes.map((note, index) => ({
        id: index,
        prompt: "What note is this?",
        correctAnswers: [note],
        key: 'C',
        scaleType: 'Major',
        drillMode: 'Key Conjurer',
    }));
};


const Quiz: React.FC<QuizProps> = ({ settings, userData, onQuit, onUpdatePerformance, onDrillComplete, onToggleSkipPreDrillInfo }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('loading');
  const [feedbackDetails, setFeedbackDetails] = useState<FeedbackDetails | null>(null);
  const [feedbackQuestion, setFeedbackQuestion] = useState<Question | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [scoreChange, setScoreChange] = useState<{ value: number, id: number } | null>(null);
  const [instrumentLabelMode, setInstrumentLabelMode] = useState<InstrumentLabelMode>('notes');
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  
  const [questionPart, setQuestionPart] = useState<QuestionPart>('find_note');
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

  // Simon Memory Game State
  const [memoryLevel, setMemoryLevel] = useState(1);
  const [memoryMasterSequence, setMemoryMasterSequence] = useState<Note[]>([]);
  const [memoryCurrentSequence, setMemoryCurrentSequence] = useState<Note[]>([]);
  const [memoryPlaybackIndex, setMemoryPlaybackIndex] = useState(0);
  const [memoryDisplayIndex, setMemoryDisplayIndex] = useState(0);
  const [displayHighlight, setDisplayHighlight] = useState<string | null>(null);
  const [simonCorrectFlash, setSimonCorrectFlash] = useState<string | null>(null);
  const isSimonGameMode = settings.drillMode === 'Simon Memory Game';
  const [simonKeySequence, setSimonKeySequence] = useState<MusicKey[]>([]);
  const [simonCurrentKeyIndex, setSimonCurrentKeyIndex] = useState(0);
  const [simonScore, setSimonScore] = useState(0);

  // Galaxy Constructor state
  const isGalaxyConstructorMode = settings.drillMode === 'Galaxy Constructor';
  const [builtIntervals, setBuiltIntervals] = useState<string[]>([]);
  const [intervalChoices, setIntervalChoices] = useState<string[]>([]);
  const [galaxyConstructedNotes, setGalaxyConstructedNotes] = useState<Note[]>([]);
  const constructorInitialized = useRef(false);

  // Note Discovery state
  const isNoteDiscoveryMode = settings.drillMode === 'Key Conjurer';
  const [discoveryRound, setDiscoveryRound] = useState<number>(1);
  const [revealedNoteNames, setRevealedNoteNames] = useState<Set<Note>>(new Set());
  const [choiceOptions, setChoiceOptions] = useState<Note[]>([]);
  const [highlightedUniqueId, setHighlightedUniqueId] = useState<string | null>(null);
  const [incorrectChoice, setIncorrectChoice] = useState<Note | null>(null);
  const [animatingSacrifice, setAnimatingSacrifice] = useState<Set<Note>>(new Set());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [totalCorrectInDrill, setTotalCorrectInDrill] = useState(0);
  const [totalIncorrectInDrill, setTotalIncorrectInDrill] = useState(0);
  const [reinforcementMessage, setReinforcementMessage] = useState<string | null>(null);
  const [lives, setLives] = useState(3);
  const [countdownMessage, setCountdownMessage] = useState<string | undefined>(undefined);


  // ScaleSweeper state
  const isScaleSweeperMode = settings.drillMode === 'ScaleSweeper';
  const [sweeperPhase, setSweeperPhase] = useState<SweeperPhase>('discovery');
  const [sweeperKeySequence, setSweeperKeySequence] = useState<MusicKey[]>([]);
  const [sweeperCurrentKeyIndex, setSweeperCurrentKeyIndex] = useState(0);
  const [sweeperBpm, setSweeperBpm] = useState(settings.bpm);
  const [sweeperFoundNotes, setSweeperFoundNotes] = useState<string[]>([]);
  const [sweeperMines, setSweeperMines] = useState<string[]>([]);
  const [sweeperNoteLabels, setSweeperNoteLabels] = useState<{ [key: string]: string | number }>({});
  const [finalOctaveNoteId, setFinalOctaveNoteId] = useState<string | null>(null);
  const [isFinalNoteUnlocked, setIsFinalNoteUnlocked] = useState(false);
  const [sweeperScore, setSweeperScore] = useState(0);
  const sweeperRoundInitialized = useRef(false);
  
  // Degree Dash State
  const isDegreeDashMode = settings.drillMode === 'Degree Dash';
  const isDegreeDashProMode = settings.drillMode === 'Degree Dash Pro';
  const isAnyDegreeDash = isDegreeDashMode || isDegreeDashProMode;
  const [degreeDashRound, setDegreeDashRound] = useState(1);
  const [degreeDashPhase, setDegreeDashPhase] = useState<DegreeDashPhase>('fill_in');

  // Note Professor state
  const isNoteProfessorMode = settings.drillMode === 'Note Professor';
  const isEducationalMode = useMemo(() => isNoteProfessorMode || isGalaxyConstructorMode || (isNoteDiscoveryMode && discoveryRound === 1), [isNoteProfessorMode, isNoteDiscoveryMode, isGalaxyConstructorMode, discoveryRound]);

  // Refs for accessing state within setInterval
  useScrollToElement(scrollTargetId, quizPhase === 'active', currentQuestionIndex);
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  const displayHighlightRef = useRef(displayHighlight);
  useEffect(() => { displayHighlightRef.current = displayHighlight; }, [displayHighlight]);
  const memoryCurrentSequenceRef = useRef(memoryCurrentSequence);
  useEffect(() => { memoryCurrentSequenceRef.current = memoryCurrentSequence; }, [memoryCurrentSequence]);
  const memoryDisplayIndexRef = useRef(memoryDisplayIndex);
  useEffect(() => { memoryDisplayIndexRef.current = memoryDisplayIndex; }, [memoryDisplayIndex]);
  const sweeperPhaseRef = useRef(sweeperPhase);
  useEffect(() => { sweeperPhaseRef.current = sweeperPhase; }, [sweeperPhase]);
  const degreeDashPhaseRef = useRef(degreeDashPhase);
  useEffect(() => { degreeDashPhaseRef.current = degreeDashPhase; }, [degreeDashPhase]);


  const audioCtxRef = useRef<AudioContext | null>(null);
  const { playNote, stopNote } = useSustainedNote(settings.instrument);
  
  const currentQuestion: Question | undefined = useMemo(() => {
    if (isScaleSweeperMode && sweeperKeySequence[sweeperCurrentKeyIndex]) {
        const key = sweeperKeySequence[sweeperCurrentKeyIndex];
        const scale = getScale(key, settings.scaleType);
        return {
            id: sweeperCurrentKeyIndex,
            prompt: `Sweep for the ${key} ${settings.scaleType} scale`,
            correctAnswers: scale.notes,
            key,
            scaleType: settings.scaleType,
            drillMode: 'ScaleSweeper',
        };
    }
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex, isScaleSweeperMode, sweeperKeySequence, sweeperCurrentKeyIndex, settings.scaleType]);

  const activeQuestion = feedbackQuestion || currentQuestion;
  const isMultiNoteQuestion = activeQuestion?.correctAnswers.length > 1 && !isGalaxyConstructorMode && !isScaleSweeperMode && settings.drillMode !== 'Scale Detective' && settings.drillMode !== 'Simon Memory Game' && !isNoteDiscoveryMode;

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
        audioCtxRef.current?.close();
    }
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.start(audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  }, []);

  const playVictorySound = useCallback(() => {
    const victoryNotes = [
        { freq: 261.63, delay: 0, duration: 0.15 },    // C4
        { freq: 329.63, delay: 120, duration: 0.15 },   // E4
        { freq: 392.00, delay: 240, duration: 0.15 },   // G4
        { freq: 523.25, delay: 360, duration: 0.4 }, // C5
    ];
    victoryNotes.forEach(note => {
        setTimeout(() => {
            playTone(note.freq, note.duration, 'triangle', 0.15);
        }, note.delay);
    });
  }, [playTone]);

  const playLossSound = useCallback(() => {
    playTone(110, 0.8, 'sawtooth', 0.15);
  }, [playTone]);

  const playCorrectSound = useCallback(() => playTone(523.25, 0.2, 'triangle'), [playTone]);
  const playIncorrectSound = useCallback(() => {
    playTone(138.59, 0.3, 'sawtooth');
    playVibration(VIBRATION_PATTERNS.INCORRECT);
  }, [playTone]);
  const playTickSound = useCallback(() => playTone(1200, 0.05, 'triangle', 0.1), [playTone]);

  const scale: Scale | null = useMemo(() => {
    if (!activeQuestion) return null;
    return getScale(activeQuestion.key, activeQuestion.scaleType);
  }, [activeQuestion]);

  const handleFinish = useCallback((success: boolean, customMessage?: string) => {
    stopNote();
    if (success) {
      playVictorySound();
    } else {
      playLossSound();
    }

    const finalScore = isSimonGameMode ? simonScore : (isGalaxyConstructorMode ? score : (isScaleSweeperMode ? sweeperScore : (isNoteDiscoveryMode ? totalCorrectInDrill : (isAnyDegreeDash ? Math.max(0, degreeDashRound - 1) : score))));
    let totalQuestions = questions.length;
    if (isGalaxyConstructorMode) totalQuestions = score;
    if (isNoteDiscoveryMode) totalQuestions = questions.length;
    if (isSimonGameMode) totalQuestions = simonKeySequence.length * MAX_MEMORY_LEVEL;
    if (isScaleSweeperMode) totalQuestions = sweeperKeySequence.length;
    if (isAnyDegreeDash) totalQuestions = 5;

    let finalMessage = success ? (customMessage || "Drill Complete!") : "BEATS DROPPED!";
    let unlockedItem: string | null = null;
    let isNewHighScore = false;
    
    if (isSimonGameMode) {
        finalMessage = success ? "Congratulations! All Keys Mastered!" : "GAME OVER";
        if (finalScore > userData.simonHighScore) {
            finalMessage = "New High Score!";
            isNewHighScore = true;
        }
    }

    if (success) {
      if (settings.drillMode === 'Key Conjurer') {
          finalMessage = 'Trial Complete!';
          if (totalIncorrectInDrill < 3) finalMessage = "Note Master!";
      }
    }
    
    const finalTotalAnswers = totalCorrectInDrill + totalIncorrectInDrill;
    const finalAccuracy = finalTotalAnswers > 0 ? Math.round((totalCorrectInDrill / finalTotalAnswers) * 100) : 0;
    const finalAvgResponse = finalTotalAnswers > 0 ? totalResponseTime / finalTotalAnswers : 0;
    const finalMaxStreak = Math.max(maxStreak, streak);

    setCompletionData({
        success,
        score: finalScore,
        totalQuestions,
        finalMessage,
        unlockedItem,
        memoryLevel: isSimonGameMode ? memoryLevel : undefined,
        bpmLevel: correctAnswersInLevel,
        isNewHighScore,
        accuracy: finalAccuracy,
        maxStreak: finalMaxStreak,
        avgResponseTime: finalAvgResponse
    });
    setGameState('finished');
    onDrillComplete({ score: finalScore, totalQuestions, level: settings.level, success, drillMode: settings.drillMode, bpmLevel: correctAnswersInLevel });
  }, [score, questions.length, settings, userData, onDrillComplete, memoryLevel, isSimonGameMode, correctAnswersInLevel, simonScore, simonKeySequence.length, isGalaxyConstructorMode, isScaleSweeperMode, sweeperScore, sweeperKeySequence.length, playVictorySound, playLossSound, stopNote, isNoteDiscoveryMode, totalCorrectInDrill, totalIncorrectInDrill, totalResponseTime, maxStreak, streak, isAnyDegreeDash, degreeDashRound]);

  const goToNextQuestion = useCallback(() => {
    stopNote();
    setScrollTargetId(null);
    setMaxStreak(s => Math.max(s, streak));
    const nextIndex = currentQuestionIndex + 1;

    if (isNoteDiscoveryMode) {
        if (nextIndex >= questions.length) { // Round complete
            if (discoveryRound < 5) {
                setQuizPhase('intermission');
            } else {
                handleFinish(true); // Final round won
            }
        } else {
            setCurrentQuestionIndex(nextIndex);
            setGameState('playing');
            setQuestionStartTime(Date.now());
        }
        return;
    }

    // --- End of drill checks for other modes ---
    if (nextIndex >= questions.length) {
        if (settings.drillMode === 'Scale Detective' || isGalaxyConstructorMode || isNoteProfessorMode) {
            handleFinish(true);
            return;
        }
        handleFinish(true, "You've exhausted all the questions! Amazing!");
        return;
    }

    // --- Proceed to next question ---
    setCurrentQuestionIndex(nextIndex);
    setGameState('playing');
    setFeedbackDetails(null);
    setFeedbackQuestion(null);
    setFoundNotes([]);
    setQuestionPart('find_note');
    setSelectedRootKey(null);
    setHadMistakeThisQuestion(false);
    setQuestionBeatTimer(QUESTION_BEAT_LIMIT);

    // Galaxy Constructor reset for next question
    setBuiltIntervals([]);
    setIntervalChoices([]);
    setGalaxyConstructedNotes([]);
    constructorInitialized.current = false;
  }, [currentQuestionIndex, questions.length, settings.drillMode, isGalaxyConstructorMode, isNoteProfessorMode, handleFinish, stopNote, isNoteDiscoveryMode, discoveryRound, streak]);

  const startNoteDiscoveryRound = useCallback((round: number) => {
    setDiscoveryRound(round);
    setQuizPhase('active');
    setGameState('playing');

    const config = NOTE_DISCOVERY_ROUNDS_CONFIG[round as NoteDiscoveryRound];
     if (!config) {
      console.error(`Invalid Note Discovery round: ${round}`);
      onQuit();
      return;
    }
    
    setBeats(config.beats);
    setCurrentBpm(config.bpm);

    const allNoteNames = [...ALL_NOTES];
    if (config.hidden > 0) {
      const shuffledNotes = shuffleArray(allNoteNames);
      const notesToKeep = shuffledNotes.slice(config.hidden);
      setRevealedNoteNames(new Set(notesToKeep));
    } else {
      setRevealedNoteNames(new Set(allNoteNames));
    }
    
    const questionsForRound = generateNoteDiscoveryQuestions(round);
    
    setQuestions(questionsForRound);
    setCurrentQuestionIndex(0);
    setQuestionStartTime(Date.now());
    setStreak(0);
    setConsecutiveErrors(0);
    setReinforcementMessage(null);
  }, [onQuit]);

  const handleNoteDiscoveryFailure = useCallback((reason: string) => {
    stopNote();
    playIncorrectSound();
    playVibration(VIBRATION_PATTERNS.SHAKE);

    if (lives > 1) {
        setLives(l => l - 1);
        setCountdownMessage("Try Again!");
        setQuizPhase('countdown');
    } else {
        setLives(0);
        handleFinish(false, reason);
    }
  }, [lives, stopNote, playIncorrectSound, handleFinish]);


  const handleTryAgain = useCallback(() => {
    // Reset general state
    setScore(0);
    setCurrentQuestionIndex(0);
    setGameState('playing');
    setQuizPhase(userData.preDrillInfoSeen[settings.drillMode] ? 'countdown' : 'info');
    setFeedbackDetails(null);
    setFeedbackQuestion(null);
    setShowHelp(false);
    setScoreChange(null);
    setCompletionData(null);
    setQuestionPart('find_note');
    setSelectedRootKey(null);
    setFoundNotes([]);
    setIncorrectNoteFeedback(null);
    setHadMistakeThisQuestion(false);
    setBeats(settings.totalBeats);
    setCurrentBpm(settings.bpm);
    setCorrectAnswersInLevel(0);
    setQuestionBeatTimer(QUESTION_BEAT_LIMIT);
    setScrollTargetId(null);
    
    // Reset mode-specific state
    setMemoryLevel(1);
    setMemoryCurrentSequence([]);
    setMemoryPlaybackIndex(0);
    setMemoryDisplayIndex(0);
    setDisplayHighlight(null);
    setSimonCorrectFlash(null);
    setBuiltIntervals([]);
    setIntervalChoices([]);
    setGalaxyConstructedNotes([]);
    constructorInitialized.current = false;

    setDiscoveryRound(1);
    setRevealedNoteNames(new Set());
    setChoiceOptions([]);
    setHighlightedUniqueId(null);
    setAnimatingSacrifice(new Set());
    setStreak(0);
    setMaxStreak(0);
    setConsecutiveErrors(0);
    setTotalCorrectInDrill(0);
    setTotalIncorrectInDrill(0);
    setTotalResponseTime(0);
    setLives(3);
    
    setSweeperPhase('discovery');
    setSweeperCurrentKeyIndex(0);
    setSweeperBpm(settings.bpm);
    setSweeperScore(0);
    sweeperRoundInitialized.current = false;
    
    setDegreeDashRound(1);
    setDegreeDashPhase('fill_in');

    if (isNoteDiscoveryMode) {
      startNoteDiscoveryRound(1);
    } else if (isScaleSweeperMode) {
        const shuffledKeys = [...MUSIC_KEYS].sort(() => Math.random() - 0.5);
        setSweeperKeySequence(shuffledKeys);
        setQuestions([]); // Sweeper manages its own questions
    } else if (isSimonGameMode) {
        const shuffledKeys = [...MUSIC_KEYS].sort(() => 0.5 - Math.random());
        setSimonKeySequence(shuffledKeys);
        setSimonCurrentKeyIndex(0);
        setCurrentBpm(settings.bpm);
        setSimonScore(0);
        
        const firstKey = shuffledKeys[0];
        const scale = getScale(firstKey, 'Major');
        setMemoryMasterSequence(scale.notes);

        setQuestions([{
            id: 0,
            prompt: `Memorize the sequence from ${firstKey} Major`,
            correctAnswers: scale.notes, // This is the note pool for the sequence
            key: firstKey,
            scaleType: 'Major',
            drillMode: 'Simon Memory Game',
        }]);
    } else {
        let generatedQuestions;
        if (isAnyDegreeDash) {
            // Always start Degree Dash modes in C
            generatedQuestions = generateDrillQuestions({ ...settings, key: 'C', questionCount: 1 });
        } else {
            generatedQuestions = generateDrillQuestions(settings, userData.performance);
        }
        setQuestions(generatedQuestions);
    }
  }, [settings, isSimonGameMode, isScaleSweeperMode, userData.performance, userData.preDrillInfoSeen, isNoteDiscoveryMode, startNoteDiscoveryRound, isAnyDegreeDash]);

  useEffect(() => {
    // This effect resets the quiz state and should only run when the quiz settings change,
    // which signifies the start of a new quiz.
    handleTryAgain();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // Intentionally omitting `userData` and other dependencies that shouldn't trigger a full reset.

  // Initial setup for Galaxy Constructor
    useEffect(() => {
        if (isGalaxyConstructorMode && currentQuestion && quizPhase === 'active' && !constructorInitialized.current) {
            constructorInitialized.current = true;
            const currentScale = getScale(currentQuestion.key, currentQuestion.scaleType);
            setGalaxyConstructedNotes([currentScale.notes[0]]);

            const intervalSequence = getIntervalSequenceForScale(currentScale.type);
            const correctNextInterval = intervalSequence[0];
            
            const distractors = INTERVAL_NAMES.filter(name => name !== correctNextInterval);
            const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];

            setIntervalChoices([correctNextInterval, randomDistractor].sort(() => Math.random() - 0.5));
        }
    }, [isGalaxyConstructorMode, currentQuestion, quizPhase, settings.instrument]);
    
    // Setup for each Note Discovery question
    useEffect(() => {
        if (isNoteDiscoveryMode && currentQuestion && quizPhase === 'active') {
            const correctNoteName = currentQuestion.correctAnswers[0].replace(/-?\d.*$/, '') as Note;
    
            let allInstancesOfNote: { note: Note; uniqueId: string }[] = [];
            if (settings.instrument === 'Piano') {
                for (let i = 24; i < 24 + 61; i++) {
                    const note = ALL_NOTES[i % 12];
                    if (note === correctNoteName) {
                        const octave = Math.floor(i / 12) - 1;
                        allInstancesOfNote.push({ note, uniqueId: `${note}${octave}` });
                    }
                }
            } else {
                const tuning = settings.instrument === 'Guitar' ? GUITAR_TUNING : BASS_TUNING;
                allInstancesOfNote = getFretboardNotes(tuning, 12)
                    .filter(n => n.note === correctNoteName)
                    .map(n => ({ note: n.note, uniqueId: `${n.note}-${n.string}-${n.fret}` }));
            }
            
            const randomNote = allInstancesOfNote[Math.floor(Math.random() * allInstancesOfNote.length)];
            
            if (randomNote && randomNote.uniqueId) {
                const uniqueId = randomNote.uniqueId;
                const scrollId = settings.instrument === 'Piano' ? uniqueId : `fret-${uniqueId}`;
    
                const distractors = ALL_NOTES.filter(n => n !== correctNoteName);
                const shuffledDistractors = distractors.sort(() => 0.5 - Math.random());
                const options = [correctNoteName, ...shuffledDistractors.slice(0, 3)].sort(() => 0.5 - Math.random());
                
                setChoiceOptions(options);
                setHighlightedUniqueId(uniqueId);
                setScrollTargetId(scrollId);
            } else {
                console.error(`Failed to find an instance of note "${correctNoteName}" on the selected instrument. Skipping question.`);
                goToNextQuestion();
            }
        }
    }, [isNoteDiscoveryMode, currentQuestion, quizPhase, settings.instrument, goToNextQuestion]);


    // Setup for each ScaleSweeper round
    useEffect(() => {
        if (isScaleSweeperMode && quizPhase === 'active' && currentQuestion && !sweeperRoundInitialized.current) {
            sweeperRoundInitialized.current = true;
            const rootNoteName = currentQuestion.correctAnswers[0];
            
            let allInstrumentNotes: { note: Note; uniqueId: string }[] = [];
            if (settings.instrument === 'Piano') {
                for (let i = 24; i < 24 + 61; i++) {
                    const note = ALL_NOTES[i % 12];
                    const octave = Math.floor(i / 12) - 1;
                    allInstrumentNotes.push({ note, uniqueId: `${note}${octave}` });
                }
            } else {
                const tuning = settings.instrument === 'Guitar' ? GUITAR_TUNING : BASS_TUNING;
                allInstrumentNotes = getFretboardNotes(tuning, 12).map(n => ({ note: n.note, uniqueId: `${n.note}-${n.string}-${n.fret}` }));
            }

            const allRootNotesOnInstrument = allInstrumentNotes
                .filter(n => n.note === rootNoteName)
                .sort((a, b) => uniqueIdToSortable(a.uniqueId) - uniqueIdToSortable(b.uniqueId));

            if (allRootNotesOnInstrument.length > 0) {
                const finalNote = allRootNotesOnInstrument.pop()!.uniqueId; // The highest octave one
                setFinalOctaveNoteId(finalNote);
                
                const initialFound = allRootNotesOnInstrument.map(n => n.uniqueId);
                const initialLabels: { [key: string]: string | number } = {};
                initialFound.forEach(id => initialLabels[id] = 1);
                
                setSweeperFoundNotes(initialFound);
                setSweeperNoteLabels(initialLabels);
            } else {
                // Fallback if no root note is found (should not happen)
                setFinalOctaveNoteId(null);
                setSweeperFoundNotes([]);
                setSweeperNoteLabels({});
            }
            setIsFinalNoteUnlocked(false);
            setSweeperMines([]);
        }
    }, [isScaleSweeperMode, quizPhase, currentQuestion, settings.instrument, sweeperRoundInitialized]);


  // Generate new sequence for Simon Game when level or key changes
  useEffect(() => {
      if (isSimonGameMode && memoryMasterSequence.length > 0 && quizPhase === 'active') {
          const newSequence = memoryMasterSequence.slice(0, memoryLevel);
          setMemoryCurrentSequence(newSequence);
          setMemoryPlaybackIndex(0);
          setMemoryDisplayIndex(0);
          setGameState('memory_display');
      }
  }, [isSimonGameMode, memoryLevel, memoryMasterSequence, quizPhase]);

  const handleQuestionTimeOut = useCallback(() => {
      if (gameState !== 'playing' || !currentQuestion || quizPhase !== 'active') return;
      stopNote();
      onUpdatePerformance({ ...currentQuestion, isCorrect: false, drillMode: settings.drillMode });
      playIncorrectSound();
      setBeats(b => Math.max(0, b - settings.beatPenalty));
      setScoreChange({ value: -settings.beatPenalty, id: Date.now() });

      if (isSimonGameMode || isGalaxyConstructorMode) {
          handleFinish(false);
          return;
      }

      setFeedbackQuestion(currentQuestion);
      setFeedbackDetails({ status: 'incorrect', playedNote: null, correctAnswers: getUniqueAnswersForQuestion(currentQuestion) });
      setGameState('feedback');

      setTimeout(() => goToNextQuestion(), 1500);
  }, [gameState, playIncorrectSound, currentQuestion, onUpdatePerformance, settings.beatPenalty, goToNextQuestion, quizPhase, isSimonGameMode, isGalaxyConstructorMode, handleFinish, stopNote, settings.drillMode]);
  
  // Main BPM Timer - drives game ticks and Simon Game display
  useEffect(() => {
    if ((gameState !== 'playing' && gameState !== 'memory_display') || quizPhase !== 'active' || isEducationalMode) return;
    if (isScaleSweeperMode && sweeperPhaseRef.current !== 'time_attack') return;
    if (isNoteDiscoveryMode && discoveryRound === 1) return;
    if(isAnyDegreeDash && degreeDashPhaseRef.current !== 'timed_finale') return;


    let effectiveBpm = isScaleSweeperMode ? sweeperBpm : currentBpm;
    if (effectiveBpm === 0) return;

    const intervalTime = (60 / effectiveBpm) * 1000;

    const interval = setInterval(() => {
        if (sweeperPhaseRef.current !== 'intermission') {
            playTickSound();
            playVibration(VIBRATION_PATTERNS.TICK);
        }
        
        // Handle Simon Game sequence display if active
        if (gameStateRef.current === 'memory_display') {
            const sequence = memoryCurrentSequenceRef.current;
            const index = memoryDisplayIndexRef.current;

            if (index >= sequence.length) {
                setDisplayHighlight(null);
                setGameState('playing');
                setQuestionBeatTimer(QUESTION_BEAT_LIMIT * sequence.length);
            } else {
                const noteToShow = sequence[index];
                setDisplayHighlight(noteToShow);
                setMemoryDisplayIndex(prev => prev + 1);
            }
        }
        
        // Don't decrement beats while displaying the memory sequence.
        if (gameStateRef.current !== 'memory_display') {
            setBeats(b => {
                if (b - 1 <= 0) {
                    clearInterval(interval);
                    if (isNoteDiscoveryMode) {
                        handleNoteDiscoveryFailure("Time's Up!");
                    } else if(isAnyDegreeDash) {
                        handleFinish(false, "Out of time!");
                    } else {
                        handleFinish(false);
                    }
                    return 0;
                }
                return b - 1;
            });
            
            if (!isGalaxyConstructorMode && !isScaleSweeperMode && !isNoteDiscoveryMode) {
                setQuestionBeatTimer(t => {
                    if (t - 1 <= 0) {
                        handleQuestionTimeOut();
                        return QUESTION_BEAT_LIMIT;
                    }
                    return t - 1;
                });
            }
        }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [gameState, quizPhase, playTickSound, handleFinish, handleQuestionTimeOut, isSimonGameMode, currentBpm, isGalaxyConstructorMode, isScaleSweeperMode, sweeperBpm, sweeperPhase, isEducationalMode, isNoteDiscoveryMode, discoveryRound, handleNoteDiscoveryFailure, isAnyDegreeDash, degreeDashPhase]);
  
  const healthPercent = (beats / settings.totalBeats) * 100;
  const isDanger = !isEducationalMode && healthPercent < 25;

  // Low health pulse vibration
  useEffect(() => {
    if (isDanger && gameState === 'playing' && quizPhase === 'active') {
      const pulseInterval = setInterval(() => {
        playVibration(VIBRATION_PATTERNS.LOW_HEALTH_PULSE);
      }, 2000); // Match the 2s duration of the CSS pulse animation

      return () => clearInterval(pulseInterval);
    }
  }, [isDanger, gameState, quizPhase]);

  const handleRootKeySelection = useCallback((selectedKey: MusicKey) => {
    if (gameState !== 'playing' || !currentQuestion || questionPart !== 'identify_root' || quizPhase !== 'active') return;
    
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
    }
    setFeedbackDetails({ status: isCorrect ? 'correct' : 'incorrect', playedNote: null, correctAnswers: getUniqueAnswersForQuestion(currentQuestion) });
    setFeedbackQuestion(currentQuestion);
    setGameState('feedback');
    setTimeout(() => goToNextQuestion(), 1500);
  }, [gameState, currentQuestion, questionPart, playCorrectSound, playIncorrectSound, onUpdatePerformance, settings, goToNextQuestion, quizPhase, stopNote]);

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

        // BPM Increase Logic for survival modes
        const isSurvivalMode = !isSimonGameMode && !isGalaxyConstructorMode && !isScaleSweeperMode && isEducationalMode;
        if (isSurvivalMode && newCorrectCount > 0 && newCorrectCount % BPM_INCREASE_THRESHOLD === 0) {
            setCurrentBpm(bpm => bpm + BPM_INCREMENT);
            setBpmIncreasePulse(true);
            setTimeout(() => setBpmIncreasePulse(false), 1000);
        }
    }, [playCorrectSound, settings.beatAward, correctAnswersInLevel, hadMistakeThisQuestion, questionBeatTimer, isSimonGameMode, isGalaxyConstructorMode, isScaleSweeperMode, isEducationalMode]);

    const handleSingleNoteIncorrect = useCallback(() => {
        stopNote();
        playIncorrectSound();
        setBeats(b => Math.max(0, b - settings.beatPenalty));
        setScoreChange({ value: -settings.beatPenalty, id: Date.now() });
        setHadMistakeThisQuestion(true);
    }, [playIncorrectSound, settings.beatPenalty, stopNote]);
    
    const showFeedbackAndMoveNext = useCallback((isCorrect: boolean, playedUniqueNote: string) => {
        setFeedbackQuestion(currentQuestion!);
        setGameState('feedback');
        setFeedbackDetails({ status: isCorrect ? 'correct' : 'incorrect', playedNote: playedUniqueNote, correctAnswers: getUniqueAnswersForQuestion(currentQuestion!) });
        setTimeout(() => goToNextQuestion(), 1500);
    }, [currentQuestion, goToNextQuestion]);

    const handleStandardAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        const answers = getUniqueAnswersForQuestion(currentQuestion!);
        const areAnswersOctaveSpecific = answers.length > 0 && /\d/.test(answers[0]);
        const isCorrect = areAnswersOctaveSpecific
            ? answers.includes(playedUniqueNote)
            : answers.includes(playedNoteName);
            
        onUpdatePerformance({ ...currentQuestion!, isCorrect, drillMode: settings.drillMode });

        if (isCorrect) {
            handleSingleNoteCorrect();
        } else {
            handleSingleNoteIncorrect();
        }
        showFeedbackAndMoveNext(isCorrect, playedUniqueNote);
    }, [currentQuestion, onUpdatePerformance, settings.drillMode, handleSingleNoteCorrect, handleSingleNoteIncorrect, showFeedbackAndMoveNext]);

    const handleMultiNoteAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        if (incorrectNoteFeedback) return;
        
        const expectedAnswers = getUniqueAnswersForQuestion(currentQuestion!);
        const areAnswersOctaveSpecific = expectedAnswers.length > 0 && /\d/.test(expectedAnswers[0]);
        const isCorrectNote = areAnswersOctaveSpecific ? expectedAnswers.includes(playedUniqueNote) : expectedAnswers.includes(playedNoteName);

        if (isCorrectNote) {
            const noteToAdd = areAnswersOctaveSpecific ? playedUniqueNote : playedNoteName;
            if (foundNotes.includes(noteToAdd)) return; // Already found

            const newFoundNotes = [...foundNotes, noteToAdd];
            setFoundNotes(newFoundNotes);
            playCorrectSound();
            
            if (new Set(newFoundNotes).size === new Set(expectedAnswers).size) { // Question Complete
                onUpdatePerformance({ ...currentQuestion!, isCorrect: !hadMistakeThisQuestion, drillMode: settings.drillMode });
                handleSingleNoteCorrect(); // Use same reward logic
                showFeedbackAndMoveNext(true, playedUniqueNote);
            }
        } else {
            setIncorrectNoteFeedback(playedUniqueNote);
            setTimeout(() => setIncorrectNoteFeedback(null), 500);
            handleSingleNoteIncorrect();
        }
    }, [incorrectNoteFeedback, currentQuestion, foundNotes, playCorrectSound, onUpdatePerformance, hadMistakeThisQuestion, settings.drillMode, handleSingleNoteCorrect, showFeedbackAndMoveNext, handleSingleNoteIncorrect]);
    
    const handleScaleDetectiveAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        if (questionPart !== 'find_note' || !currentQuestion) return;

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
    }, [questionPart, currentQuestion, playCorrectSound, handleSingleNoteIncorrect]);

    const handleSimonGameAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        if (!currentQuestion) return;
        const isCorrect = playedNoteName === memoryCurrentSequence[memoryPlaybackIndex];
        if (isCorrect) {
            playCorrectSound();
            setSimonCorrectFlash(playedUniqueNote);
            setTimeout(() => setSimonCorrectFlash(null), 300);

            const nextPlaybackIndex = memoryPlaybackIndex + 1;
            setMemoryPlaybackIndex(nextPlaybackIndex);

            if (nextPlaybackIndex >= memoryCurrentSequence.length) { 
                setSimonScore(s => s + 1);
                setBeats(b => b + settings.beatAward);
                setScoreChange({ value: settings.beatAward, id: Date.now() });
                onUpdatePerformance({ ...currentQuestion, isCorrect: !hadMistakeThisQuestion, drillMode: settings.drillMode });
                setHadMistakeThisQuestion(false);
                
                const nextMemoryLevel = memoryLevel + 1;
                if (nextMemoryLevel > MAX_MEMORY_LEVEL) {
                    const nextKeyIndex = simonCurrentKeyIndex + 1;
                    if (nextKeyIndex >= simonKeySequence.length) {
                        handleFinish(true); // Mastered all keys
                    } else {
                        const nextKey = simonKeySequence[nextKeyIndex];
                        const nextScale = getScale(nextKey, 'Major');
                        setSimonCurrentKeyIndex(nextKeyIndex);
                        setCurrentBpm(bpm => bpm + 15);
                        setMemoryMasterSequence(nextScale.notes);
                        setMemoryLevel(1);
                        setQuestions([{ id: nextKeyIndex, prompt: `Memorize the sequence from ${nextKey} Major`, correctAnswers: nextScale.notes, key: nextKey, scaleType: 'Major', drillMode: 'Simon Memory Game' }]);
                        setCurrentQuestionIndex(0);
                    }
                } else {
                    setMemoryLevel(nextMemoryLevel);
                }
            }
        } else {
            stopNote();
            playIncorrectSound();
            setIncorrectNoteFeedback(playedUniqueNote);
            setGameState('feedback');
            setBeats(b => Math.max(0, b - settings.beatPenalty));
            setScoreChange({ value: -settings.beatPenalty, id: Date.now() });
            onUpdatePerformance({ ...currentQuestion, isCorrect: false, drillMode: settings.drillMode });
            setTimeout(() => handleFinish(false), 2000);
        }
    }, [memoryCurrentSequence, memoryPlaybackIndex, playCorrectSound, settings.beatAward, onUpdatePerformance, currentQuestion, hadMistakeThisQuestion, settings.drillMode, memoryLevel, simonCurrentKeyIndex, simonKeySequence, handleFinish, playIncorrectSound, settings.beatPenalty, stopNote]);
  
    const handleGalaxyConstructorAnswer = useCallback((selectedInterval: string) => {
        if (!currentQuestion || !scale) return;

        const intervalSequence = getIntervalSequenceForScale(scale.type);
        const correctNextInterval = intervalSequence[builtIntervals.length];

        const isCorrect = selectedInterval === correctNextInterval;
        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: 'Galaxy Constructor' });

        if (isCorrect) {
            playCorrectSound();
            setBeats(b => b + settings.beatAward);
            setScoreChange({ value: settings.beatAward, id: Date.now() });
            
            const newBuiltIntervals = [...builtIntervals, selectedInterval];
            setBuiltIntervals(newBuiltIntervals);
            setGalaxyConstructedNotes(scale.notes.slice(0, newBuiltIntervals.length + 1));

            if (newBuiltIntervals.length === 7) { // Scale complete
                setScore(s => s + 1);
                setTimeout(() => goToNextQuestion(), 2000);
            } else {
                // Set up next choice
                const nextCorrect = intervalSequence[newBuiltIntervals.length];
                const distractors = INTERVAL_NAMES.filter(name => name !== nextCorrect);
                const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
                setIntervalChoices([nextCorrect, randomDistractor].sort(() => Math.random() - 0.5));
            }
        } else {
            stopNote();
            playIncorrectSound();
            setBeats(b => Math.max(0, b - settings.beatPenalty));
            setScoreChange({ value: -settings.beatPenalty, id: Date.now() });
            // Shuffle choices to give user another try
            setIntervalChoices(prev => [...prev].sort(() => Math.random() - 0.5));
        }

    }, [currentQuestion, scale, builtIntervals, onUpdatePerformance, playCorrectSound, settings, playIncorrectSound, goToNextQuestion, stopNote]);
    
    const goToNextSweeperKey = useCallback(() => {
        sweeperRoundInitialized.current = false;
        if (sweeperPhase === 'discovery' && sweeperCurrentKeyIndex === sweeperKeySequence.length - 1) {
            setSweeperScore(s => s + 1);
            setSweeperPhase('intermission');
            setTimeout(() => {
                const shuffledKeys = [...MUSIC_KEYS].sort(() => 0.5 - Math.random());
                setSweeperKeySequence(shuffledKeys);
                setSweeperCurrentKeyIndex(0);
                setSweeperBpm(90);
                setSweeperPhase('time_attack');
            }, 3000);
        } else if (sweeperPhase === 'time_attack' && sweeperCurrentKeyIndex === sweeperKeySequence.length - 1) {
            setSweeperScore(s => s + 1);
            handleFinish(true, "Time Attack Complete!");
        } else {
            setSweeperScore(s => s + 1);
            if (sweeperPhase === 'time_attack') {
                setSweeperBpm(b => b + 15);
            }
            setSweeperCurrentKeyIndex(i => i + 1);
        }
    }, [sweeperPhase, sweeperCurrentKeyIndex, sweeperKeySequence.length, handleFinish]);


    const handleScaleSweeperAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
        if (!currentQuestion || !scale) return;
        const activeNotes = [...sweeperFoundNotes, ...sweeperMines];
        if (activeNotes.includes(playedUniqueNote)) return;

        const isCorrect = currentQuestion.correctAnswers.includes(playedNoteName);
        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: settings.drillMode });

        if (isCorrect) {
            playCorrectSound();
            setBeats(b => b + settings.beatAward);
            setScoreChange({ value: settings.beatAward, id: Date.now() });
            
            const newFoundNotes = [...sweeperFoundNotes, playedUniqueNote];

            if (playedUniqueNote === finalOctaveNoteId) {
                setSweeperFoundNotes(newFoundNotes);
                setSweeperNoteLabels(prev => ({ ...prev, [playedUniqueNote]: 1 }));
                setTimeout(() => goToNextSweeperKey(), 1500);

            } else {
                const degree = getDegreeFromNote(playedNoteName, scale);
                if(degree) setSweeperNoteLabels(prev => ({...prev, [playedUniqueNote]: degree}));
                setSweeperFoundNotes(newFoundNotes);

                const uniqueFoundNoteNames = new Set(newFoundNotes.map(n => n.replace(/-?\d.*$/, '')));
                if (uniqueFoundNoteNames.size === 7) {
                    setIsFinalNoteUnlocked(true);
                }
            }
        } else {
            stopNote();
            playIncorrectSound();
            setSweeperMines(prev => [...prev, playedUniqueNote]);
            setIncorrectNoteFeedback(playedUniqueNote);
            setTimeout(() => setIncorrectNoteFeedback(null), 500);
            
            setBeats(b => Math.max(0, b - settings.beatPenalty));
            setScoreChange({ value: -settings.beatPenalty, id: Date.now() });
        }
    }, [currentQuestion, scale, sweeperFoundNotes, sweeperMines, onUpdatePerformance, settings, playCorrectSound, playIncorrectSound, finalOctaveNoteId, goToNextSweeperKey, stopNote]);

    const handleNoteProfessorAnswer = useCallback((playedUniqueNote: string, playedNoteName: Note) => {
      if (!currentQuestion) return;
  
      const targetNoteName = currentQuestion.correctAnswers[0];
      const isCorrect = playedNoteName === targetNoteName;
      
      onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: 'Note Professor' });
  
      if (isCorrect) {
          playCorrectSound();
          setScore(s => s + 1);
          setScoreChange({ value: 1, id: Date.now() });
  
          setFeedbackQuestion(currentQuestion);
          setGameState('feedback');
          setFeedbackDetails({ status: 'correct', playedNote: playedUniqueNote, correctAnswers: [targetNoteName] }); 
          
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex >= questions.length) {
              setTimeout(() => handleFinish(true), 2000);
          } else {
              setTimeout(() => goToNextQuestion(), 2500);
          }
      } else {
          stopNote();
          playIncorrectSound();
          setHadMistakeThisQuestion(true);
          setIncorrectNoteFeedback(playedUniqueNote);
          setTimeout(() => setIncorrectNoteFeedback(null), 500);
      }
    }, [currentQuestion, currentQuestionIndex, questions.length, onUpdatePerformance, playCorrectSound, playIncorrectSound, goToNextQuestion, handleFinish, stopNote]);

    const handleNoteDiscoveryChoice = useCallback((choice: Note) => {
        if (!currentQuestion) return;

        playNoteSound(`${choice}4`, 'Piano');

        setTotalResponseTime(t => t + (Date.now() - questionStartTime));
        const isCorrect = choice === (currentQuestion.correctAnswers[0].replace(/-?\d.*$/, ''));
        onUpdatePerformance({ ...currentQuestion, isCorrect, drillMode: 'Key Conjurer' });

        if (isCorrect) {
            playCorrectSound();
            setScore(s => s + 1);
            
            const config = NOTE_DISCOVERY_ROUNDS_CONFIG[discoveryRound as NoteDiscoveryRound];
            if (config && config.beatAward > 0) {
                setBeats(b => b + config.beatAward);
                setScoreChange({ value: config.beatAward, id: Date.now() });
            } else {
                setScoreChange({ value: 1, id: Date.now() });
            }

            setRevealedNoteNames(prev => new Set(prev).add(choice));
            setTotalCorrectInDrill(c => c + 1);

            const newStreak = streak + 1;
            setStreak(newStreak);
            setConsecutiveErrors(0);

            if(discoveryRound === 1) setReinforcementMessage("Nice work!");
            else if (discoveryRound === 2 && newStreak > 0 && newStreak % 5 === 0) setReinforcementMessage("Power Note!");
            else if (discoveryRound === 4 && newStreak > 0 && newStreak % 4 === 0) setReinforcementMessage("Combo Saver!");
            else setReinforcementMessage(null);
            
            goToNextQuestion();
        } else {
            playIncorrectSound();
            setHadMistakeThisQuestion(true);
            setIncorrectChoice(choice);
            setTimeout(() => setIncorrectChoice(null), 500);
            setTotalIncorrectInDrill(i => i + 1);
            setMaxStreak(s => Math.max(s, streak));
            setStreak(0);

            const newErrors = consecutiveErrors + 1;
            setConsecutiveErrors(newErrors);

            if(discoveryRound === 2) setReinforcementMessage("Tip: Try humming the note!");
            else if (discoveryRound === 3 && newErrors >= 2) {
                setReinforcementMessage("Tip: Focus on note groups!");
                setConsecutiveErrors(0); // Reset after showing tip
            } else setReinforcementMessage(null);


            const config = NOTE_DISCOVERY_ROUNDS_CONFIG[discoveryRound];
            if (config.penalty > 0) {
                const revealedArray = Array.from(revealedNoteNames);
                const sacrificed: Note[] = [];
                for (let i = 0; i < config.penalty && revealedArray.length > 0; i++) {
                    const randomIndex = Math.floor(Math.random() * revealedArray.length);
                    const noteToRemove = revealedArray.splice(randomIndex, 1)[0];
                    if (noteToRemove) sacrificed.push(noteToRemove);
                }
                
                if (sacrificed.length > 0) {
                    const newRevealedNotes = new Set(revealedNoteNames);
                    sacrificed.forEach(n => newRevealedNotes.delete(n));
                    const willLose = newRevealedNotes.size === 0 && discoveryRound > 1;

                    playVibration(VIBRATION_PATTERNS.SACRIFICE);
                    setAnimatingSacrifice(new Set(sacrificed));
                    
                    setTimeout(() => {
                        setRevealedNoteNames(newRevealedNotes);
                        setAnimatingSacrifice(new Set());
                        if (willLose) {
                            handleNoteDiscoveryFailure("All revealed notes lost!");
                        }
                    }, 600); // Animation duration
                }
            }
        }
    }, [currentQuestion, onUpdatePerformance, playCorrectSound, playIncorrectSound, goToNextQuestion, discoveryRound, revealedNoteNames, handleFinish, questionStartTime, streak, consecutiveErrors, handleNoteDiscoveryFailure]);

    const handleAnswer = useCallback((playedUniqueNote: string, event?: React.MouseEvent) => {
        if ((gameState !== 'playing' && sweeperPhaseRef.current !== 'intermission') || quizPhase !== 'active' || !currentQuestion) return;
        
        const playedNoteName = playedUniqueNote.replace(/-?\d.*$/, '') as Note;

        if (isAnyDegreeDash) return;
        
        playNote(playedUniqueNote);

        if (isNoteDiscoveryMode) {
            stopNote();
            return;
        }
        else if (isNoteProfessorMode) handleNoteProfessorAnswer(playedUniqueNote, playedNoteName);
        else if (isGalaxyConstructorMode) return; // Input is from interval buttons
        else if (isScaleSweeperMode) handleScaleSweeperAnswer(playedUniqueNote, playedNoteName);
        else if (isSimonGameMode) handleSimonGameAnswer(playedUniqueNote, playedNoteName);
        else if (settings.drillMode === 'Scale Detective') handleScaleDetectiveAnswer(playedUniqueNote, playedNoteName);
        else if (isMultiNoteQuestion) handleMultiNoteAnswer(playedUniqueNote, playedNoteName);
        else handleStandardAnswer(playedUniqueNote, playedNoteName);
    }, [gameState, quizPhase, currentQuestion, isNoteProfessorMode, isGalaxyConstructorMode, isScaleSweeperMode, isSimonGameMode, isMultiNoteQuestion, settings.drillMode, handleNoteProfessorAnswer, handleScaleSweeperAnswer, handleSimonGameAnswer, handleScaleDetectiveAnswer, handleMultiNoteAnswer, handleStandardAnswer, isNoteDiscoveryMode, isAnyDegreeDash, playNote, stopNote]);

  const handleAnswerWithSound = useCallback((playedUniqueNote: string, event?: React.MouseEvent) => {
    if (settings.inputMethod === 'Touch') {
        playNoteSound(playedUniqueNote, settings.instrument);
    }
    handleAnswer(playedUniqueNote, event);
  }, [handleAnswer, settings.inputMethod, settings.instrument]);

  useMidi(settings.inputMethod === 'MIDI', handleAnswer);
  useAudioPitch(
    settings.inputMethod === 'Mic',
    handleAnswer,
    settings.audioInputDeviceId,
    settings.micSensitivity,
    settings.micGain,
    settings.micCompressionThreshold,
    settings.micCompressionRatio
  );

  const renderedInstrument = useMemo(() => {
    let correctNotes: string[] = [];
    let incorrectNote: string | null = incorrectNoteFeedback;
    let highlightedNotes: string[] = [];
    let disabledNotes: (string | null)[] = [];
    let mineNotes: string[] = [];
    let noteLabels: { [key: string]: string | number } | undefined;
    let activeNotes: string[] | undefined;
    let justRevealedNotes: string[] | undefined;
    let currentScale = scale;
    
    if (isNoteDiscoveryMode) {
        if (highlightedUniqueId) {
            highlightedNotes = [highlightedUniqueId];
        }
    } else if (isGalaxyConstructorMode) {
        highlightedNotes = galaxyConstructedNotes;
    } else if (isScaleSweeperMode) {
        correctNotes = sweeperFoundNotes;
        mineNotes = sweeperMines;
        noteLabels = sweeperNoteLabels;
        activeNotes = [...sweeperFoundNotes, ...sweeperMines];
        if (!isFinalNoteUnlocked) {
            disabledNotes = [finalOctaveNoteId];
        }
    } else {
        if (showHelp && scale) {
          highlightedNotes.push(...scale.notes);
        }
        if (gameState === 'memory_display' && displayHighlight) {
          highlightedNotes.push(displayHighlight);
        }
        if (isMultiNoteQuestion && (gameState === 'playing' || gameState === 'feedback')) {
            correctNotes.push(...foundNotes);
        }
        if (simonCorrectFlash) {
            correctNotes.push(simonCorrectFlash);
        }
        
        if (gameState === 'feedback' && feedbackDetails) {
            if (feedbackDetails.status === 'incorrect' && feedbackDetails.playedNote) {
                incorrectNote = feedbackDetails.playedNote;
            }
            
            if (isNoteProfessorMode && feedbackDetails.status === 'correct') {
                correctNotes.push(...feedbackDetails.correctAnswers);
            } else if (isSimonGameMode && feedbackDetails.status === 'correct') {
                correctNotes.push(...feedbackDetails.correctAnswers);
            } else if (!isSimonGameMode && !isNoteProfessorMode) {
               correctNotes.push(...feedbackDetails.correctAnswers);
            }
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
    }
    
    const commonProps = {
      onNotePlayed: handleAnswerWithSound,
      highlightedNotes: [...new Set(highlightedNotes)],
      correctNotes: [...new Set(correctNotes)],
      incorrectNote,
      labelMode: instrumentLabelMode,
      scale: currentScale,
      noteLabels,
      disabledNotes: disabledNotes.filter((n): n is string => n !== null),
      mineNotes,
      activeNotes,
      justRevealedNotes,
      revealedNoteNames,
      drillMode: settings.drillMode,
      quizPhase,
      animatingSacrifice,
    };
    
    switch (settings.instrument) {
      case 'Piano': return <Piano {...commonProps} />;
      case 'Guitar':
      case 'Bass': return <Fretboard instrument={settings.instrument} {...commonProps} handedness={settings.handedness} />;
      default: return null;
    }
  }, [
      handleAnswerWithSound, incorrectNoteFeedback, isGalaxyConstructorMode, galaxyConstructedNotes,
      showHelp, scale, gameState, displayHighlight,
      isMultiNoteQuestion, foundNotes, simonCorrectFlash, feedbackDetails,
      isSimonGameMode, settings.drillMode, settings.instrument, settings.handedness,
      activeQuestion, questionPart, instrumentLabelMode,
      isScaleSweeperMode, sweeperFoundNotes, sweeperMines, sweeperNoteLabels, isFinalNoteUnlocked, finalOctaveNoteId,
      isNoteProfessorMode, isNoteDiscoveryMode, highlightedUniqueId, revealedNoteNames, quizPhase, animatingSacrifice,
  ]);

  const handleCountdownComplete = () => {
    setCountdownMessage(undefined);
    if (isNoteDiscoveryMode) {
        if (quizPhase === 'intermission') { // Advancing to next round
            startNoteDiscoveryRound(discoveryRound + 1);
        } else { // Retrying current round after losing a life
            startNoteDiscoveryRound(discoveryRound);
        }
    } else {
        setQuizPhase('active');
    }
  };

  const handleQuit = () => {
    stopNote();
    onQuit();
  };
  
  const handleDegreeDashPlacement = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
        playCorrectSound();
    } else {
        playIncorrectSound();
        if (degreeDashPhase === 'timed_finale') {
            setBeats(b => Math.max(0, b - settings.beatPenalty));
        }
    }
  }, [playCorrectSound, playIncorrectSound, degreeDashPhase, settings.beatPenalty]);

  const handleDegreeDashRoundComplete = useCallback(() => {
    setQuizPhase('intermission');
    setTimeout(() => {
        const nextRound = degreeDashRound + 1;
        setDegreeDashRound(nextRound);
        
        if (nextRound <= 6) {
             const newQuestions = generateDrillQuestions({ ...settings, key: 'Random', questionCount: 1 }, userData.performance);
             setQuestions(newQuestions);
             setCurrentQuestionIndex(0);
             if (nextRound > 5) {
                setDegreeDashPhase('timed_finale');
                setBeats(50);
                setCurrentBpm(70);
                setQuizPhase('countdown');
             } else {
                setDegreeDashPhase('fill_in');
                // The countdown component will handle setting phase back to 'active'
             }
        } else {
            handleFinish(true, "Degree Dash Mastered!");
        }
    }, 2000);
  }, [degreeDashRound, handleFinish, settings, userData.performance]);


  if (quizPhase === 'info') {
    return <PreQuizInfo drillMode={settings.drillMode} onReady={() => setQuizPhase('countdown')} onSkipChange={(skip) => onToggleSkipPreDrillInfo(settings.drillMode, skip)} />;
  }

  if (quizPhase === 'countdown' || quizPhase === 'intermission' || (isScaleSweeperMode && sweeperPhase === 'intermission')) {
    let message: string | undefined = countdownMessage;
    if (!message) {
      if (isScaleSweeperMode && sweeperPhase === 'intermission') message = 'Time Attack!';
      else if (isNoteDiscoveryMode && quizPhase === 'intermission') message = `Round ${discoveryRound + 1}!`;
      else if (isAnyDegreeDash && quizPhase === 'intermission') {
        if (degreeDashRound >= 5) message = 'Final Challenge!';
        else message = `Round ${degreeDashRound + 1}`;
      }
    }
    return <Countdown onComplete={handleCountdownComplete} message={message} />;
  }

  if (questions.length === 0 && !isScaleSweeperMode || (!currentQuestion && isScaleSweeperMode)) {
    return <div className="text-center p-8">Loading drill...</div>;
  }
  
  if (gameState === 'finished' && completionData) {
    let scoreLabel = 'correct';
    if (isNoteProfessorMode) scoreLabel = 'notes learned';
    else if (isNoteDiscoveryMode) scoreLabel = 'notes found';
    else if (isGalaxyConstructorMode) scoreLabel = 'galaxies built';
    else if (isSimonGameMode) scoreLabel = 'rounds passed';
    else if (isScaleSweeperMode) scoreLabel = 'scales swept';
    else if(isAnyDegreeDash) scoreLabel = 'rounds cleared';
    else if (settings.drillMode.includes('BPM')) scoreLabel = 'levels survived';

    return (
      <div className="bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-8 rounded-xl text-center shadow-2xl w-full max-w-md">
        <h2 className={`text-3xl font-bold mb-2 ${completionData.success ? 'text-green-400' : 'text-red-500'}`}>
            {completionData.finalMessage}
        </h2>
        
        <div className="text-xl mb-4 text-stone-200">
            {`Final Score: `}
            <span className="text-orange-400 font-bold">{completionData.score}</span>
            {` ${scoreLabel}`}
        </div>

        {isNoteDiscoveryMode && completionData.success && (
          <div className="grid grid-cols-3 gap-2 text-sm text-stone-300 bg-black/20 p-3 rounded-lg my-4">
              <div><span className="font-bold text-green-400">{completionData.accuracy}%</span> Accuracy</div>
              <div><span className="font-bold text-orange-400">{completionData.maxStreak}</span> Max Streak</div>
              <div><span className="font-bold text-sky-400">{(completionData.avgResponseTime! / 1000).toFixed(2)}s</span> Avg Time</div>
          </div>
        )}
        
        {completionData.unlockedItem && (
            <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
                <p className="text-lg font-bold text-green-300 animate-level-up">{completionData.unlockedItem}</p>
            </div>
        )}

        {completionData.success ? (
          <button
            onClick={onQuit}
            className="mt-8 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
          >
            Continue
          </button>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTryAgain}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
              Try Again
            </button>
            <button
              onClick={handleQuit}
              className="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Main Menu
            </button>
          </div>
        )}
      </div>
    );
  }

  const feedbackClass = gameState !== 'feedback' ? 'bg-black/30 border-transparent' : 
    (feedbackDetails?.status === 'correct' ? 'bg-green-500/20 border-green-500' : 
     feedbackDetails?.status === 'found' ? 'bg-sky-500/20 border-sky-500' : 
     'bg-red-500/20 border-red-500');

  const getPrompt = () => {
      if (!activeQuestion) {
          if (isGalaxyConstructorMode) return "Construct the Galaxy...";
          if (isNoteDiscoveryMode) return "What note is this?";
          return 'Loading...';
      }
      
      if (isNoteProfessorMode) {
          if (gameState === 'feedback' && feedbackDetails?.status === 'correct') {
              return `Excellent! That's ${feedbackDetails.correctAnswers[0]}.`;
          }
          return activeQuestion.prompt;
      }
      if (isNoteDiscoveryMode) {
          if (discoveryRound > 1) return `Find the note!`;
          return "What note is this?";
      }
      if (isGalaxyConstructorMode) return activeQuestion.prompt;
      if (isScaleSweeperMode) {
          if (isFinalNoteUnlocked) return "Find the final octave note!";
          return activeQuestion.prompt || "Sweep the scale!";
      }
      if (isAnyDegreeDash) {
        const title = isDegreeDashProMode ? 'Degree Dash Pro' : 'Degree Dash';
        const phaseText = degreeDashPhase === 'timed_finale' ? 'Final Challenge' : `Round ${degreeDashRound}/5`;
        return `${phaseText}: Fill in the ${activeQuestion.key} ${activeQuestion.scaleType} scale degrees.`;
      }
      if (gameState === 'memory_display') return `Memorize... (Round ${memoryLevel})`;
      if (settings.drillMode === 'Scale Detective') {
          return questionPart === 'find_note' 
            ? "Find the missing note." 
            : `What is the root key of the ${activeQuestion.scaleType} scale?`;
      }
      if (isSimonGameMode) {
          return `Play the sequence! (${memoryPlaybackIndex}/${memoryCurrentSequence.length})`;
      }
      return activeQuestion.prompt;
  };

  const questionTimeLimit = isSimonGameMode ? QUESTION_BEAT_LIMIT * memoryCurrentSequence.length : QUESTION_BEAT_LIMIT;

  const renderHeader = () => {
    const beatsLow = !isEducationalMode && beats > 0 && beats <= 10;
    const effectiveBpm = isScaleSweeperMode ? sweeperBpm : currentBpm;
    
    return (
       <header className="flex justify-between items-center text-stone-300 flex-shrink-0">
        {/* Left Score/Progress Block */}
        <div className="min-w-[80px]">
           {isNoteDiscoveryMode ? (
               <div className="text-left">
                    <div className="font-bold text-base sm:text-lg text-stone-100">
                        Round: {discoveryRound} / 5
                    </div>
                    <div className="text-xs text-orange-400 font-semibold">Streak: {streak}</div>
                    <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: lives }).map((_, i) => (
                            <HeartIcon key={i} className="h-4 w-4 text-red-500" />
                        ))}
                    </div>
               </div>
           ) : isAnyDegreeDash ? (
                <div className="font-bold text-base sm:text-lg text-stone-100">
                    Round: {Math.min(5, degreeDashRound)} / 5
                </div>
           ) : isEducationalMode ? (
                 <div className="font-bold text-base sm:text-lg text-stone-100">
                    {
                        isNoteProfessorMode ? `Learned: ${score} / 12` :
                        isGalaxyConstructorMode ? `Galaxies: ${score} / ${questions.length}` : ''
                    }
                </div>
            ) : isSimonGameMode ? (
                <div className="flex flex-col text-left text-xs gap-y-0.5">
                    <div className="font-bold text-sm sm:text-base text-stone-100">Round: {memoryLevel}</div>
                    <div className="text-stone-400">
                        {simonKeySequence.length > 0 && <span className="font-semibold">Key: {simonKeySequence[simonCurrentKeyIndex]}</span>}
                        {currentBpm > 0 && <span className={`font-semibold ml-2`}>BPM: {currentBpm}</span>}
                    </div>
                     <div className="text-stone-400">
                        <span className="font-semibold">Score: {simonScore}</span>
                        <span className="font-semibold ml-2">High: {userData.simonHighScore}</span>
                    </div>
                </div>
            ) : isScaleSweeperMode ? (
                <div className="font-bold text-base sm:text-lg text-stone-100">
                   Round: {`${sweeperScore + 1} / ${sweeperKeySequence.length}`}
                   {sweeperPhase === 'time_attack' && <span className="text-fuchsia-400 animate-pulse ml-2">{sweeperBpm} BPM</span>}
               </div>
            ) : ( // Default case for other modes
                <div className="flex flex-col text-left text-xs gap-y-0.5">
                     <span className="font-bold text-base sm:text-lg text-stone-100">
                        Score: {score}
                    </span>
                    {effectiveBpm > 0 && (
                        <span className={`font-semibold text-sm ${bpmIncreasePulse ? 'animate-bpm-pulse' : 'text-fuchsia-400'}`}>
                            BPM: {effectiveBpm}
                        </span>
                    )}
                </div>
            )}
        </div>

        {/* Center Beats Block */}
        <div className={`text-2xl sm:text-3xl font-bold relative ${beatsLow ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
            {isEducationalMode || (isAnyDegreeDash && degreeDashPhase !== 'timed_finale') ? '∞' : beats}
            <span className="text-sm sm:text-base font-normal text-stone-400 ml-1">Beats</span>
            {scoreChange && (
                <span
                    key={scoreChange.id}
                    className={`absolute -top-6 right-0 text-xl sm:text-2xl font-bold animate-float-up ${scoreChange.value > 0 ? 'text-green-400' : 'text-red-500'}`}
                    style={{textShadow: '0 0 5px black'}}
                >
                    {scoreChange.value > 0 ? `+${scoreChange.value}` : scoreChange.value}
                </span>
            )}
        </div>
        
        {/* Right Buttons Block */}
        <div className="flex gap-1 sm:gap-2 min-w-[80px] justify-end">
            <button onClick={() => setShowHelp(true)} title="Help" className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-full disabled:bg-stone-600">
                <HelpIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => setInstrumentLabelMode(p => p === 'notes' ? 'degrees' : 'notes')}
                title="Toggle Note/Degree Labels"
                className={`p-2 rounded-full transition-colors disabled:bg-stone-600 ${
                    instrumentLabelMode === 'degrees' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-stone-600 hover:bg-stone-500 text-stone-200'
                }`}
            >
                <ToggleDegreesIcon className="h-5 w-5" />
            </button>
            <button onClick={handleQuit} title="Quit" className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full">
                <QuitIcon className="h-5 w-5" />
            </button>
        </div>
      </header>
    );
  };

  const effectiveBpm = isScaleSweeperMode ? sweeperBpm : currentBpm;
  const rhythmBarDuration = 60 / effectiveBpm;

  
  let vignetteOpacity = 0;
  if (!isEducationalMode && healthPercent < 60) {
      vignetteOpacity = (1 - (healthPercent / 60)) * 0.8;
  }
  
  return (
    <div className={`bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-2 sm:p-4 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden ${quizPhase === 'pre-round-animation' ? 'animate-screen-shake' : ''}`}>
        {quizPhase === 'active' && !isEducationalMode && (
          <>
            <div className="rhythm-bar" style={{ animationDuration: `${rhythmBarDuration}s` }}></div>
            <div 
              className={`vignette-overlay ${isDanger ? 'vignette-danger' : ''}`} 
              style={{ '--opacity': vignetteOpacity } as React.CSSProperties}
            ></div>
          </>
        )}
      
      <div className="relative z-10 flex flex-col w-full h-full">
        {showHelp && scale && <HelpModal scale={scale} onClose={() => setShowHelp(false)} />}
        
        {renderHeader()}
        
        {isAnyDegreeDash && currentQuestion && scale ? (
            <DegreeDash
                scale={scale}
                instrumentSettings={{ instrument: settings.instrument, handedness: settings.handedness }}
                phase={degreeDashPhase}
                round={degreeDashRound}
                disableHints={isDegreeDashProMode}
                onUpdatePerformance={onUpdatePerformance}
                onPlacement={handleDegreeDashPlacement}
                onRoundComplete={handleDegreeDashRoundComplete}
            />
        ) : (
            <div className="drill-layout flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 min-h-0 mt-2 sm:mt-4">
            
            <div className="instrument-panel relative flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 lg:order-1 overflow-hidden rounded-lg">
                {quizPhase === 'active' && !isEducationalMode && <WarpSpeedBackground bpm={effectiveBpm} />}
                <div className="relative z-10 w-full flex-1 flex items-center justify-center">
                    {!isGalaxyConstructorMode ? renderedInstrument : <div></div>}
                </div>
            </div>

            <div className="question-panel flex flex-col gap-2 sm:gap-4 lg:w-1/3 lg:max-w-sm lg:order-2">
                {isGalaxyConstructorMode && currentQuestion && scale ? (
                    <GalaxyConstructor 
                        scale={scale}
                        builtIntervals={builtIntervals}
                        intervalChoices={intervalChoices}
                        onSelectInterval={handleGalaxyConstructorAnswer}
                    />
                ) : isNoteDiscoveryMode ? (
                    <div className="flex-1 flex flex-col justify-between">
                        <div className={`prompt-container text-center p-2 sm:p-4 rounded-lg border transition-colors duration-300 relative overflow-hidden flex-1 flex flex-col justify-center ${feedbackClass}`}>
                            <h3 className="text-base sm:text-lg font-bold text-stone-300 mb-2 sm:mb-4">{settings.drillMode === 'Key Conjurer' ? 'Note Discovery' : settings.drillMode.replace(/([A-Z])/g, ' $1').trim()}</h3>
                            <p className={`text-xl sm:text-2xl font-semibold text-stone-100 min-h-[40px] flex items-center justify-center transition-all duration-500 ${isPerfectPulse ? 'animate-perfect-pulse' : ''}`}>
                                {getPrompt()}
                            </p>
                            {reinforcementMessage && <p className="text-sm text-yellow-300 mt-2 animate-pulse">{reinforcementMessage}</p>}
                        </div>
                        <div className="actions-container grid grid-cols-2 gap-2 mt-4">
                            {choiceOptions.map(note => {
                                const isIncorrect = incorrectChoice === note;
                                return (
                                <button
                                    key={note}
                                    onClick={() => handleNoteDiscoveryChoice(note)}
                                    className={`py-3 px-2 rounded-md font-semibold text-lg transition-all duration-200 ${isIncorrect ? 'bg-red-500 animate-wiggle' : 'bg-stone-800 hover:bg-stone-700'} text-white`}
                                >
                                    {note}
                                </button>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                <>
                    <div className={`prompt-container text-center p-2 sm:p-4 rounded-lg border transition-colors duration-300 relative overflow-hidden flex-1 flex flex-col justify-center ${feedbackClass}`}>
                        <h3 className="text-base sm:text-lg font-bold text-stone-300 mb-2 sm:mb-4">{settings.drillMode === 'Key Conjurer' ? 'Note Discovery' : settings.drillMode.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        {!isEducationalMode && gameState === 'playing' && (
                            <div 
                                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" 
                                style={{ width: `${(questionBeatTimer / questionTimeLimit) * 100}%`, transition: `width ${(60 / currentBpm)}s linear` }}
                            ></div>
                        )}
                        <p className={`text-xl sm:text-2xl font-semibold text-stone-100 min-h-[40px] flex items-center justify-center transition-all duration-500 ${isPerfectPulse ? 'animate-perfect-pulse' : ''}`}>
                            {getPrompt()}
                        </p>
                        {isMultiNoteQuestion && gameState === 'playing' && (
                            <div className="text-sm text-stone-300 mt-2">
                                Found {foundNotes.length} of {activeQuestion.correctAnswers.length}
                            </div>
                        )}
                    </div>
                    
                    {settings.drillMode === 'Scale Detective' && questionPart === 'identify_root' && gameState === 'playing' && (
                        <div className="actions-container grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-3 gap-1 sm:gap-2">
                            {MUSIC_KEYS.map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleRootKeySelection(key)}
                                    className="py-2 sm:py-3 px-2 rounded-md font-semibold transition-colors duration-200 bg-stone-800 hover:bg-stone-700 text-white"
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    )}

                    {gameState === 'feedback' && settings.drillMode === 'Scale Detective' && selectedRootKey && feedbackQuestion && (
                        <div className="actions-container grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-3 gap-1 sm:gap-2">
                            {MUSIC_KEYS.map(key => {
                                const isCorrect = key === feedbackQuestion.key;
                                const isSelected = key === selectedRootKey;
                                let classes = 'bg-stone-800 text-white';
                                if (isCorrect) {
                                    classes = 'bg-green-500 text-black transform scale-105';
                                } else if (isSelected && !isCorrect) {
                                    classes = 'bg-red-500 text-black';
                                }
                                return (
                                    <button
                                        key={key}
                                        disabled
                                        className={`py-2 sm:py-3 px-2 rounded-md font-semibold transition-all duration-200 ${classes}`}
                                    >
                                        {key}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
                )}
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;