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

  constructor(
    variables: CSPVariable[],
    constraints: CSPConstraint[],
    algorithm: AlgorithmType = 'backtracking'
  ) {
    this.variables = new Map(variables.map(v => [v.name, { ...v }]));
    this.constraints = constraints;
    this.algorithm = algorithm;
  }

  setStepCallback(callback: (step: SolverStep) => void) {
    this.stepCallback = callback;
  }

  private addStep(step: Omit<SolverStep, 'timestamp'>) {
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
    const testAssignment = new Map(assignment);
    testAssignment.set(variable, value);

    for (const constraint of this.constraints) {
      // Check if all variables in the constraint are assigned
      const allAssigned = constraint.variables.every(v => testAssignment.has(v));
      
      if (allAssigned) {
        if (!constraint.check(testAssignment)) {
          return false;
        }
      }
    }

    return true;
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
      this.nodesExplored++;

      this.addStep({
        type: 'assign',
        variable,
        value,
        message: `Trying ${variable} = ${value}`,
        assignment: new Map(assignment),
      });

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (this.isConsistent(variable, value, assignment)) {
        assignment.set(variable, value);

        this.addStep({
          type: 'constraint_check',
          variable,
          value,
          message: `✓ ${variable} = ${value} is consistent`,
          assignment: new Map(assignment),
        });

        const result = await this.backtrack(assignment, delay);
        if (result !== null) {
          return result;
        }

        assignment.delete(variable);
        this.backtracks++;

        this.addStep({
          type: 'backtrack',
          variable,
          value,
          message: `✗ Backtracking from ${variable} = ${value}`,
          assignment: new Map(assignment),
        });
      } else {
        this.addStep({
          type: 'constraint_check',
          variable,
          value,
          message: `✗ ${variable} = ${value} violates constraints`,
          assignment: new Map(assignment),
        });
      }
    }

    return null;
  }

  async solve(delay: number = 0): Promise<{
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
