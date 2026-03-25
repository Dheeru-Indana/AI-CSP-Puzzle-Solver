import { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Play, Pause, RotateCcw, Sparkles, Brain, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CSPSolver, SolverStep, AlgorithmType } from '../utils/csp-solver';
import { 
  PREDEFINED_PUZZLES, 
  puzzleToCSP, 
  assignmentToWords, 
  CryptArithmeticPuzzle 
} from '../utils/crypt-arithmetic';
import { toast } from 'sonner';

export function CryptArithmetic() {
  const [selectedPuzzleIndex, setSelectedPuzzleIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<CryptArithmeticPuzzle>(PREDEFINED_PUZZLES[0]);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('backtracking');
  const [speed, setSpeed] = useState([300]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [solution, setSolution] = useState<Map<string, number> | null>(null);
  const [metrics, setMetrics] = useState({ nodesExplored: 0, backtracks: 0, timeMs: 0 });
  const [currentAssignment, setCurrentAssignment] = useState<Map<string, number>>(new Map());
  const solverRef = useRef<CSPSolver | null>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (solverRef.current) solverRef.current.abort();
    };
  }, []);

  useEffect(() => {
    setPuzzle(PREDEFINED_PUZZLES[selectedPuzzleIndex]);
    handleReset();
  }, [selectedPuzzleIndex]);

  const handleReset = () => {
    if (solverRef.current) {
      solverRef.current.abort();
    }
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setSteps([]);
    setCurrentStepIndex(-1);
    setSolution(null);
    setMetrics({ nodesExplored: 0, backtracks: 0, timeMs: 0 });
    setCurrentAssignment(new Map());
  };

  const handleSolve = async (instant = false) => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      return;
    }

    handleReset();
    setIsRunning(true);
    
    // Allow React to gracefully render the reset state before diving into heavy synchronous calculations
    await new Promise(resolve => setTimeout(resolve, 50));

    const { variables, constraints } = puzzleToCSP(puzzle);
    const solver = new CSPSolver(variables, constraints, algorithm);
    solverRef.current = solver;

    const allSteps: SolverStep[] = [];
    solver.setStepCallback((step) => {
      allSteps.push(step);
    });

    const result = await solver.solve(0, !instant);
    
    // If we aborted during the solve, don't apply results
    if (solverRef.current !== solver || solver.getMetrics().nodesExplored === 0 && !result.solution) {
       return;
    }
    setSteps(allSteps);
    setSolution(result.solution);
    setMetrics(result.metrics);

    if (instant) {
      if (result.solution) {
        setCurrentAssignment(new Map(result.solution));
        toast.success('Puzzle solved instantly!');
      } else {
        toast.error('No solution found');
      }
      setIsRunning(false);
      return;
    }

    // Animate through steps
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    let stepIndex = 0;
    animationIntervalRef.current = setInterval(() => {
      if (stepIndex < allSteps.length) {
        setCurrentStepIndex(stepIndex);
        setCurrentAssignment(new Map(allSteps[stepIndex].assignment));
        stepIndex++;
      } else {
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        setIsRunning(false);
        if (result.solution) {
          toast.success('Puzzle solved successfully!');
        } else {
          toast.error('No solution found');
        }
      }
    }, Math.max(10, 1000 - speed[0] * 3));
  };

  const display = assignmentToWords(puzzle, currentAssignment);
  const uniqueLetters = Array.from(new Set([...puzzle.operand1, ...puzzle.operand2, ...puzzle.result]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Crypt Arithmetic Solver</h1>
          </div>
          <p className="text-muted-foreground">
            Watch AI decode mathematical puzzles where letters represent unique digits
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL - Puzzle Area */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Puzzle</CardTitle>
              <CardDescription>Current assignment state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Puzzle Display */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-xl p-8 border border-indigo-500/20">
                <div className="space-y-4 font-mono text-center">
                  {/* Operand 1 */}
                  <div className="flex justify-end gap-1">
                    {display.operand1.split('').map((char, i) => (
                      <motion.div
                        key={`op1-${i}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl ${
                          /\d/.test(char)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-muted/50 text-muted-foreground border border-border'
                        }`}
                      >
                        {char}
                      </motion.div>
                    ))}
                  </div>

                  {/* Operator + Operand 2 */}
                  <div className="flex justify-end gap-1">
                    <div className="w-12 h-12 flex items-center justify-center text-2xl text-muted-foreground">
                      {puzzle.operation}
                    </div>
                    {display.operand2.split('').map((char, i) => (
                      <motion.div
                        key={`op2-${i}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl ${
                          /\d/.test(char)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-muted/50 text-muted-foreground border border-border'
                        }`}
                      >
                        {char}
                      </motion.div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-muted-foreground/30" />

                  {/* Result */}
                  <div className="flex justify-end gap-1">
                    {display.result.split('').map((char, i) => (
                      <motion.div
                        key={`res-${i}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl ${
                          /\d/.test(char)
                            ? solution
                              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-muted/50 text-muted-foreground border border-border'
                        }`}
                      >
                        {char}
                      </motion.div>
                    ))}
                  </div>

                  {/* Numerical Values */}
                  {display.num1 !== undefined && display.num2 !== undefined && (
                    <div className="mt-6 pt-6 border-t border-border/50 text-sm text-muted-foreground">
                      <div>{display.num1.toLocaleString()}</div>
                      <div>
                        {puzzle.operation} {display.num2.toLocaleString()}
                      </div>
                      <div className="border-t border-border/50 mt-1 pt-1">
                        {display.numResult?.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Letter Assignments */}
              <div>
                <h4 className="text-sm font-medium mb-3">Letter Assignments</h4>
                <div className="grid grid-cols-5 gap-2">
                  {uniqueLetters.map(letter => {
                    const value = currentAssignment.get(letter);
                    const isActive = currentStep?.variable === letter;
                    return (
                      <motion.div
                        key={letter}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className={`p-3 rounded-lg border text-center ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/50'
                            : value !== undefined
                            ? 'border-green-500/30 bg-green-500/10'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">{letter}</div>
                        <div className="font-mono font-bold">
                          {value !== undefined ? value : '?'}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CENTER PANEL - Controls */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Control Panel</CardTitle>
              <CardDescription>Configure and run the AI solver</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Puzzle Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Puzzle</label>
                <Select
                  value={selectedPuzzleIndex.toString()}
                  onValueChange={(value) => setSelectedPuzzleIndex(parseInt(value))}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_PUZZLES.map((p, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {p.operand1} {p.operation} {p.operand2} = {p.result}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Algorithm Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Algorithm</label>
                <Select
                  value={algorithm}
                  onValueChange={(value) => setAlgorithm(value as AlgorithmType)}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backtracking">Backtracking</SelectItem>
                    <SelectItem value="forward-checking">Backtracking + Forward Checking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Animation Speed: {speed[0]}%
                </label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={10}
                  max={300}
                  step={10}
                  disabled={isRunning}
                />
              </div>

              <Separator />

              {/* Control Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                  onClick={() => handleSolve(true)}
                  disabled={isRunning}
                >
                  <Zap className="w-4 h-4" /> Find Answer Instantly
                </Button>

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20"
                  onClick={() => handleSolve(false)}
                  disabled={isRunning && !isPaused}
                >
                  {isRunning ? (
                    isPaused ? (
                      <>
                        <Play className="w-4 h-4" /> Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" /> Pause
                      </>
                    )
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Solve with AI
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full gap-2" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>

              <Separator />

              {/* Metrics */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Brain className="w-3 h-3" />
                      Nodes
                    </div>
                    <div className="text-2xl font-bold">{metrics.nodesExplored}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Zap className="w-3 h-3" />
                      Backtracks
                    </div>
                    <div className="text-2xl font-bold">{metrics.backtracks}</div>
                  </div>
                </div>
                {metrics.timeMs > 0 && (
                  <div className="bg-gradient-to-r from-indigo-500/10 to-violet-600/10 rounded-lg p-3 border border-indigo-500/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Solve Time
                    </div>
                    <div className="text-2xl font-bold">{metrics.timeMs}ms</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT PANEL - AI Visualization */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>AI Thinking</CardTitle>
              <CardDescription>Step-by-step solver log</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Current Step Indicator */}
              {currentStep && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 p-4 rounded-lg border ${
                    currentStep.type === 'solution'
                      ? 'bg-green-500/10 border-green-500/30'
                      : currentStep.type === 'backtrack'
                      ? 'bg-red-500/10 border-red-500/30'
                      : currentStep.type === 'assign'
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <Badge className="mb-2" variant="outline">
                    Step {currentStepIndex + 1} / {steps.length}
                  </Badge>
                  <p className="text-sm">{currentStep.message}</p>
                </motion.div>
              )}

              {/* Steps Timeline */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  <AnimatePresence>
                    {steps.slice(0, currentStepIndex + 1).map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className={`p-3 rounded-lg text-sm border ${
                          index === currentStepIndex
                            ? 'bg-indigo-500/20 border-indigo-500/50'
                            : step.type === 'solution'
                            ? 'bg-green-500/5 border-green-500/20'
                            : step.type === 'backtrack'
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-muted/30 border-border/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            step.type === 'assign'
                              ? 'bg-blue-500/20 text-blue-400'
                              : step.type === 'backtrack'
                              ? 'bg-red-500/20 text-red-400'
                              : step.type === 'solution'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.type}
                          </span>
                        </div>
                        <p className="mt-1">{step.message}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}