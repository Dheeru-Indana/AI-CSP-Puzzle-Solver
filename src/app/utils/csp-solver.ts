export interface CSPVariable {
  name: string;
  domain: number[];
  value?: number;
}

export interface CSPConstraint {
  variables: string[];
  check: (assignment: Map<string, number>) => boolean;
  description?: string;
}

export interface SolverStep {
  type: 'assign' | 'backtrack' | 'constraint_check' | 'solution' | 'failure';
  variable?: string;
  value?: number;
  message: string;
  assignment: Map<string, number>;
  timestamp: number;
}

export type AlgorithmType = 'backtracking' | 'forward-checking';

export class CSPSolver {
  private variables: Map<string, CSPVariable>;
  private constraints: CSPConstraint[];
  private steps: SolverStep[] = [];
  private nodesExplored = 0;
  private backtracks = 0;
  private stepCallback?: (step: SolverStep) => void;
  private algorithm: AlgorithmType = 'backtracking';
  private recordSteps: boolean = true;
  private maxSteps: number = 5000;
  private aborted: boolean = false;
  private lastYieldTime: number = 0;

  constructor(
    variables: CSPVariable[],
    constraints: CSPConstraint[],
    algorithm: AlgorithmType = 'backtracking'
  ) {
    this.variables = new Map(variables.map(v => [v.name, { ...v }]));
    this.constraints = constraints;
    this.algorithm = algorithm;
  }

  abort() {
    this.aborted = true;
  }

  setStepCallback(callback: (step: SolverStep) => void) {
    this.stepCallback = callback;
  }

  private addStep(step: Omit<SolverStep, 'timestamp'>) {
    if (!this.recordSteps && step.type !== 'solution' && step.type !== 'failure') {
      return;
    }
    
    if (this.steps.length >= this.maxSteps && step.type !== 'solution' && step.type !== 'failure') {
      return;
    }

    const fullStep = { ...step, timestamp: Date.now() };
    this.steps.push(fullStep);
    if (this.stepCallback) {
      this.stepCallback(fullStep);
    }
  }

  private isConsistent(
    variable: string,
    value: number,
    assignment: Map<string, number>
  ): boolean {
    assignment.set(variable, value); // Direct mutation for performance speedup
    let consistent = true;

    for (const constraint of this.constraints) {
      // Check if all variables in the constraint are assigned
      const allAssigned = constraint.variables.every(v => assignment.has(v));
      
      if (allAssigned) {
        if (!constraint.check(assignment)) {
          consistent = false;
          break;
        }
      }
    }

    assignment.delete(variable); // Revert before leaving function securely
    return consistent;
  }

  private selectUnassignedVariable(assignment: Map<string, number>): string | null {
    // MRV heuristic: choose variable with smallest domain
    let minDomain = Infinity;
    let selectedVar: string | null = null;

    for (const [name, variable] of this.variables) {
      if (!assignment.has(name)) {
        const domainSize = variable.domain.length;
        if (domainSize < minDomain) {
          minDomain = domainSize;
          selectedVar = name;
        }
      }
    }

    return selectedVar;
  }

  private async backtrack(
    assignment: Map<string, number>,
    delay: number = 0
  ): Promise<Map<string, number> | null> {
    if (this.aborted) return null;

    // Check if assignment is complete
    if (assignment.size === this.variables.size) {
      this.addStep({
        type: 'solution',
        message: '✓ Solution found!',
        assignment: new Map(assignment),
      });
      return assignment;
    }

    const variable = this.selectUnassignedVariable(assignment);
    if (!variable) return null;

    const varData = this.variables.get(variable)!;

    for (const value of varData.domain) {
      // 1. Instant Pruning
      // If the branch is mathematically impossible, skip it early without counting nodes!
      if (!this.isConsistent(variable, value, assignment)) {
        continue;
      }

      // 2. Variable Assignment (Valid Node)
      this.nodesExplored++;
      assignment.set(variable, value);

      this.addStep({
        type: 'assign',
        variable,
        value,
        message: `Assigned ${variable} = ${value}`,
        assignment: new Map(assignment),
      });

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (this.nodesExplored % 100 === 0) {
        // Yield to the event loop based on time to maximize compute speed while keeping UI responsive
        const now = Date.now();
        if (now - this.lastYieldTime > 40) {
          await new Promise(resolve => setTimeout(resolve, 0));
          this.lastYieldTime = Date.now();
        }
      }

      const result = await this.backtrack(assignment, delay);
      if (result !== null) {
        return result;
      }

      // 3. Recursive Branch Failed - Backtrack
      assignment.delete(variable);
      this.backtracks++;

      this.addStep({
        type: 'backtrack',
        variable,
        value,
        message: `Backtracked from ${variable} = ${value}`,
        assignment: new Map(assignment),
      });
    }

    return null;
  }

  async solve(delay: number = 0, recordSteps: boolean = true): Promise<{
    solution: Map<string, number> | null;
    steps: SolverStep[];
    metrics: {
      nodesExplored: number;
      backtracks: number;
      timeMs: number;
    };
  }> {
    this.steps = [];
    this.nodesExplored = 0;
    this.backtracks = 0;
    this.recordSteps = recordSteps;
    this.aborted = false;
    this.lastYieldTime = Date.now();

    const startTime = Date.now();
    const solution = await this.backtrack(new Map(), delay);
    const timeMs = Date.now() - startTime;

    if (!solution) {
      this.addStep({
        type: 'failure',
        message: '✗ No solution exists',
        assignment: new Map(),
      });
    }

    return {
      solution,
      steps: this.steps,
      metrics: {
        nodesExplored: this.nodesExplored,
        backtracks: this.backtracks,
        timeMs,
      },
    };
  }

  getSteps(): SolverStep[] {
    return this.steps;
  }

  getMetrics() {
    return {
      nodesExplored: this.nodesExplored,
      backtracks: this.backtracks,
    };
  }
}
