import { useState, useRef, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Play, Pause, RotateCcw, Sparkles, Plus, Trash2, Brain, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CSPSolver, SolverStep, CSPVariable, CSPConstraint, AlgorithmType } from '../utils/csp-solver';
import { toast } from 'sonner';

interface CustomVariable {
  id: string;
  name: string;
  domain: number[];
}

interface CustomConstraintDef {
  id: string;
  variables: string[];
  type: 'not-equal' | 'less-than' | 'greater-than' | 'sum-equals';
  value?: number;
}

export function CustomCSP() {
  const [variables, setVariables] = useState<CustomVariable[]>([
    { id: '1', name: 'X', domain: [1, 2, 3] },
    { id: '2', name: 'Y', domain: [1, 2, 3] },
  ]);
  const [constraints, setConstraints] = useState<CustomConstraintDef[]>([
    { id: '1', variables: ['X', 'Y'], type: 'not-equal' },
  ]);
  
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

  const addVariable = () => {
    const newId = (Math.max(0, ...variables.map(v => parseInt(v.id))) + 1).toString();
    setVariables([
      ...variables,
      { id: newId, name: `V${newId}`, domain: [1, 2, 3] },
    ]);
  };

  const removeVariable = (id: string) => {
    const varName = variables.find(v => v.id === id)?.name;
    setVariables(variables.filter(v => v.id !== id));
    // Remove constraints that use this variable
    setConstraints(constraints.filter(c => !c.variables.includes(varName || '')));
  };

  const updateVariable = (id: string, field: keyof CustomVariable, value: any) => {
    setVariables(variables.map(v => {
      if (v.id === id) {
        if (field === 'domain' && typeof value === 'string') {
          // Parse domain string like "1,2,3"
          const domain = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
          return { ...v, domain };
        }
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  const addConstraint = () => {
    if (variables.length < 2) {
      toast.error('Add at least 2 variables first');
      return;
    }
    const newId = (Math.max(0, ...constraints.map(c => parseInt(c.id))) + 1).toString();
    setConstraints([
      ...constraints,
      { 
        id: newId, 
        variables: [variables[0].name, variables[1].name], 
        type: 'not-equal' 
      },
    ]);
  };

  const removeConstraint = (id: string) => {
    setConstraints(constraints.filter(c => c.id !== id));
  };

  const updateConstraint = (id: string, field: keyof CustomConstraintDef, value: any) => {
    setConstraints(constraints.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const buildCSP = (): { variables: CSPVariable[]; constraints: CSPConstraint[] } | null => {
    if (variables.length === 0) {
      toast.error('Add at least one variable');
      return null;
    }

    const cspVariables: CSPVariable[] = variables.map(v => ({
      name: v.name,
      domain: [...v.domain],
    }));

    const cspConstraints: CSPConstraint[] = constraints.map(c => {
      const [var1, var2] = c.variables;
      
      switch (c.type) {
        case 'not-equal':
          return {
            variables: [var1, var2],
            check: (assignment) => {
              const v1 = assignment.get(var1);
              const v2 = assignment.get(var2);
              return v1 === undefined || v2 === undefined || v1 !== v2;
            },
            description: `${var1} ≠ ${var2}`,
          };
        case 'less-than':
          return {
            variables: [var1, var2],
            check: (assignment) => {
              const v1 = assignment.get(var1);
              const v2 = assignment.get(var2);
              return v1 === undefined || v2 === undefined || v1 < v2;
            },
            description: `${var1} < ${var2}`,
          };
        case 'greater-than':
          return {
            variables: [var1, var2],
            check: (assignment) => {
              const v1 = assignment.get(var1);
              const v2 = assignment.get(var2);
              return v1 === undefined || v2 === undefined || v1 > v2;
            },
            description: `${var1} > ${var2}`,
          };
        case 'sum-equals':
          return {
            variables: [var1, var2],
            check: (assignment) => {
              const v1 = assignment.get(var1);
              const v2 = assignment.get(var2);
              return v1 === undefined || v2 === undefined || v1 + v2 === (c.value || 0);
            },
            description: `${var1} + ${var2} = ${c.value}`,
          };
        default:
          return {
            variables: [var1, var2],
            check: () => true,
            description: 'Unknown constraint',
          };
      }
    });

    return { variables: cspVariables, constraints: cspConstraints };
  };

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

    const csp = buildCSP();
    if (!csp) return;

    handleReset();
    setIsRunning(true);
    
    await new Promise(resolve => setTimeout(resolve, 50));

    const solver = new CSPSolver(csp.variables, csp.constraints, algorithm);
    solverRef.current = solver;

    const allSteps: SolverStep[] = [];
    solver.setStepCallback((step) => {
      allSteps.push(step);
    });

    const result = await solver.solve(0, !instant);
    
    if (solverRef.current !== solver || (solver.getMetrics().nodesExplored === 0 && !result.solution)) {
       return;
    }
    setSteps(allSteps);
    setSolution(result.solution);
    setMetrics(result.metrics);

    if (instant) {
      if (result.solution) {
        setCurrentAssignment(new Map(result.solution));
        toast.success('CSP solved instantly!');
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
          toast.success('CSP solved successfully!');
        } else {
          toast.error('No solution found');
        }
      }
    }, Math.max(10, 1000 - speed[0] * 3));
  };

  const constraintTypeLabels = {
    'not-equal': '≠ (Not Equal)',
    'less-than': '< (Less Than)',
    'greater-than': '> (Greater Than)',
    'sum-equals': '+ = (Sum Equals)',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-500/5">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Custom CSP Builder</h1>
          </div>
          <p className="text-muted-foreground">
            Define your own constraint satisfaction problem and watch AI solve it
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL - Problem Definition */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Problem Definition</CardTitle>
              <CardDescription>Define variables and constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variables */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Variables</h4>
                  <Button size="sm" variant="outline" onClick={addVariable}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <ScrollArea className="h-[200px] pr-3">
                  <div className="space-y-3">
                    {variables.map(variable => (
                      <div key={variable.id} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Input
                            value={variable.name}
                            onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                            className="h-8 flex-1"
                            placeholder="Name"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => removeVariable(variable.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <Label className="text-xs text-muted-foreground">
                          Domain (comma-separated):
                        </Label>
                        <Input
                          value={variable.domain.join(', ')}
                          onChange={(e) => updateVariable(variable.id, 'domain', e.target.value)}
                          className="h-8 mt-1"
                          placeholder="e.g., 1, 2, 3"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Constraints */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Constraints</h4>
                  <Button size="sm" variant="outline" onClick={addConstraint}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                <ScrollArea className="h-[250px] pr-3">
                  <div className="space-y-3">
                    {constraints.map(constraint => (
                      <div key={constraint.id} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            Constraint {constraint.id}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeConstraint(constraint.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Select
                            value={constraint.variables[0]}
                            onValueChange={(value) => {
                              updateConstraint(constraint.id, 'variables', [value, constraint.variables[1]]);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {variables.map(v => (
                                <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={constraint.type}
                            onValueChange={(value) => updateConstraint(constraint.id, 'type', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(constraintTypeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={constraint.variables[1]}
                            onValueChange={(value) => {
                              updateConstraint(constraint.id, 'variables', [constraint.variables[0], value]);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {variables.map(v => (
                                <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {constraint.type === 'sum-equals' && (
                            <Input
                              type="number"
                              value={constraint.value || 0}
                              onChange={(e) => updateConstraint(constraint.id, 'value', parseInt(e.target.value))}
                              className="h-8"
                              placeholder="Sum value"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {variables.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Add variables to get started</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CENTER PANEL - Controls & Solution */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Control Panel</CardTitle>
              <CardDescription>Run solver and view results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20"
                  onClick={() => handleSolve(true)}
                  disabled={(isRunning && !isPaused) || variables.length === 0}
                >
                  <Zap className="w-4 h-4" /> Find Answer Instantly
                </Button>

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                  onClick={() => handleSolve(false)}
                  disabled={(isRunning && !isPaused) || variables.length === 0}
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
                      <Sparkles className="w-4 h-4" /> Solve CSP
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full gap-2" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>

              <Separator />

              {/* Current Solution */}
              <div>
                <h4 className="text-sm font-medium mb-3">Current Assignment</h4>
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-xl p-4 border border-emerald-500/20">
                  {variables.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {variables.map(variable => {
                        const value = currentAssignment.get(variable.name);
                        const isActive = currentStep?.variable === variable.name;
                        return (
                          <motion.div
                            key={variable.id}
                            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                            className={`p-3 rounded-lg border text-center ${
                              isActive
                                ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50'
                                : value !== undefined
                                ? 'border-green-500/30 bg-green-500/10'
                                : 'border-border bg-muted/30'
                            }`}
                          >
                            <div className="text-xs text-muted-foreground mb-1">{variable.name}</div>
                            <div className="text-xl font-bold">
                              {value !== undefined ? value : '?'}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      No variables defined
                    </p>
                  )}
                </div>
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
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-lg p-3 border border-emerald-500/20">
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
              <ScrollArea className="h-[600px] pr-4">
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
                            ? 'bg-emerald-500/20 border-emerald-500/50'
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