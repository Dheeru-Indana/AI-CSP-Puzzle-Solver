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
import { Play, Pause, RotateCcw, MapPin, Brain, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CSPSolver, SolverStep, AlgorithmType } from '../utils/csp-solver';
import { 
  PREDEFINED_MAPS, 
  mapToCSP, 
  getNodeColor,
  MapColoringProblem 
} from '../utils/map-coloring';
import { toast } from 'sonner';

export function MapColoring() {
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [mapProblem, setMapProblem] = useState<MapColoringProblem>(PREDEFINED_MAPS[0]);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('backtracking');
  const [speed, setSpeed] = useState([300]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [solution, setSolution] = useState<Map<string, number> | null>(null);
  const [metrics, setMetrics] = useState({ nodesExplored: 0, backtracks: 0, timeMs: 0 });
  const [currentAssignment, setCurrentAssignment] = useState<Map<string, number>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  useEffect(() => {
    setMapProblem(PREDEFINED_MAPS[selectedMapIndex]);
    handleReset();
  }, [selectedMapIndex]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setSteps([]);
    setCurrentStepIndex(-1);
    setSolution(null);
    setMetrics({ nodesExplored: 0, backtracks: 0, timeMs: 0 });
    setCurrentAssignment(new Map());
  };

  const handleSolve = async () => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      // Resume animation
      let stepIndex = currentStepIndex + 1;
      intervalRef.current = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStepIndex(stepIndex);
          setCurrentAssignment(new Map(steps[stepIndex].assignment));
          stepIndex++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          if (solution) {
            toast.success('Map colored successfully!');
          } else {
            toast.error('No solution found');
          }
        }
      }, 1000 - speed[0] * 9);
      return;
    }

    handleReset();
    setIsRunning(true);

    try {
      const { variables, constraints } = mapToCSP(mapProblem);
      const solver = new CSPSolver(variables, constraints, algorithm);

      const allSteps: SolverStep[] = [];
      solver.setStepCallback((step) => {
        allSteps.push(step);
      });

      const result = await solver.solve(0);
      setSteps(allSteps);
      setSolution(result.solution);
      setMetrics(result.metrics);

      // Animate through steps
      let stepIndex = 0;
      intervalRef.current = setInterval(() => {
        if (stepIndex < allSteps.length) {
          setCurrentStepIndex(stepIndex);
          setCurrentAssignment(new Map(allSteps[stepIndex].assignment));
          stepIndex++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          if (result.solution) {
            toast.success('Map colored successfully!');
          } else {
            toast.error('No solution found');
          }
        }
      }, 1000 - speed[0] * 9);
    } catch (error) {
      console.error('Solver error:', error);
      toast.error('An error occurred while solving');
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-500/5">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 rounded-xl">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Map Coloring Solver</h1>
          </div>
          <p className="text-muted-foreground">
            Watch AI solve the graph coloring problem using constraint satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL - Map Visualization */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Graph Visualization</CardTitle>
              <CardDescription>Nodes and their connections</CardDescription>
            </CardHeader>
            <CardContent>
              {/* SVG Map */}
              <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-xl p-4 border border-violet-500/20">
                <svg viewBox="0 0 550 400" className="w-full h-auto">
                  {/* Draw edges first */}
                  {mapProblem.edges.map((edge, i) => {
                    const fromNode = mapProblem.nodes.find(n => n.id === edge.from)!;
                    const toNode = mapProblem.nodes.find(n => n.id === edge.to)!;
                    return (
                      <line
                        key={i}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-border"
                        opacity="0.3"
                      />
                    );
                  })}

                  {/* Draw nodes */}
                  {mapProblem.nodes.map((node) => {
                    const color = getNodeColor(node.id, currentAssignment, mapProblem.colors);
                    const isActive = currentStep?.variable === node.id;
                    
                    return (
                      <g key={node.id}>
                        {/* Node circle */}
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={isActive ? 35 : 30}
                          fill={color || 'currentColor'}
                          className={color ? '' : 'text-muted'}
                          stroke={isActive ? '#6366f1' : 'currentColor'}
                          strokeWidth={isActive ? 4 : 2}
                          initial={{ scale: 0 }}
                          animate={{ 
                            scale: 1,
                            fill: color || 'currentColor'
                          }}
                          transition={{ duration: 0.3 }}
                        />
                        
                        {/* Node label */}
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white font-bold text-lg"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.id}
                        </text>

                        {/* Active indicator */}
                        {isActive && (
                          <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={40}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: [0.5, 0] }}
                            transition={{ 
                              duration: 1,
                              repeat: Infinity,
                              ease: "easeOut"
                            }}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Color Legend */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Available Colors</h4>
                <div className="flex gap-3">
                  {mapProblem.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground">Color {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Node Status */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Region Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {mapProblem.nodes.map(node => {
                    const colorIndex = currentAssignment.get(node.id);
                    const color = colorIndex !== undefined ? mapProblem.colors[colorIndex] : null;
                    const isActive = currentStep?.variable === node.id;
                    
                    return (
                      <div
                        key={node.id}
                        className={`p-2 rounded-lg border text-sm ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/50'
                            : color
                            ? 'border-border/50 bg-muted/30'
                            : 'border-border bg-background'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{node.id}</span>
                          {color && (
                            <div
                              className="w-4 h-4 rounded-full border border-border/50"
                              style={{ backgroundColor: color }}
                            />
                          )}
                        </div>
                      </div>
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
              {/* Map Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Map</label>
                <Select
                  value={selectedMapIndex.toString()}
                  onValueChange={(value) => setSelectedMapIndex(parseInt(value))}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_MAPS.map((m, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {m.name}
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
                  max={100}
                  step={10}
                  disabled={isRunning}
                />
              </div>

              <Separator />

              {/* Control Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  onClick={handleSolve}
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
                      <MapPin className="w-4 h-4" /> Solve with AI
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
                  <div className="bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-lg p-3 border border-violet-500/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Solve Time
                    </div>
                    <div className="text-2xl font-bold">{metrics.timeMs}ms</div>
                  </div>
                )}
              </div>

              {/* Problem Info */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h4 className="text-sm font-medium mb-2">Problem Details</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Regions: {mapProblem.nodes.length}</div>
                  <div>Connections: {mapProblem.edges.length}</div>
                  <div>Colors Available: {mapProblem.colors.length}</div>
                </div>
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
                            ? 'bg-violet-500/20 border-violet-500/50'
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
