import { CSPVariable, CSPConstraint } from './csp-solver';

export interface CryptArithmeticPuzzle {
  operand1: string;
  operand2: string;
  result: string;
  operation: '+' | '-' | '*';
}

export const PREDEFINED_PUZZLES: CryptArithmeticPuzzle[] = [
  {
    operand1: 'SEND',
    operand2: 'MORE',
    result: 'MONEY',
    operation: '+',
  },
  {
    operand1: 'TWO',
    operand2: 'TWO',
    result: 'FOUR',
    operation: '+',
  },
  {
    operand1: 'EAT',
    operand2: 'THAT',
    result: 'APPLE',
    operation: '+',
  },
];

export function puzzleToCSP(puzzle: CryptArithmeticPuzzle): {
  variables: CSPVariable[];
  constraints: CSPConstraint[];
} {
  // Extract unique letters strictly from right-to-left (least significant digit to most)
  // This seamlessly forces the `CSPSolver`'s MRV heuristic to explore columns optimally!
  const letters = new Set<string>();
  const len1 = puzzle.operand1.length;
  const len2 = puzzle.operand2.length;
  const resLen = puzzle.result.length;
  const maxLen = Math.max(len1, len2, resLen);

  for (let i = 0; i < maxLen; i++) {
    const c1 = len1 - 1 - i >= 0 ? puzzle.operand1[len1 - 1 - i] : null;
    const c2 = len2 - 1 - i >= 0 ? puzzle.operand2[len2 - 1 - i] : null;
    const cRes = resLen - 1 - i >= 0 ? puzzle.result[resLen - 1 - i] : null;

    if (c1) letters.add(c1);
    if (c2) letters.add(c2);
    if (cRes) letters.add(cRes);
  }

  const letterArray = Array.from(letters);

  // Create variables (each letter can be 0-9)
  const variables: CSPVariable[] = letterArray.map(letter => ({
    name: letter,
    domain: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  }));

  const constraints: CSPConstraint[] = [];

  // 1. Immediate Pairwise Uniqueness Pruning
  // Instead of checking if all 10 are unique at the very end of the tree,
  // we generate N*(N-1)/2 individual constraints so duplicates are killed immediately!
  for (let i = 0; i < letterArray.length; i++) {
    for (let j = i + 1; j < letterArray.length; j++) {
      constraints.push({
        variables: [letterArray[i], letterArray[j]],
        check: (assignment) => {
          return assignment.get(letterArray[i]) !== assignment.get(letterArray[j]);
        }
      });
    }
  }

  // 2. Leading zeros constraint (checked immediately upon assignment)
  const leadingLetters = [
    puzzle.operand1[0],
    puzzle.operand2[0],
    puzzle.result[0],
  ];

  for (const letter of leadingLetters) {
    constraints.push({
      variables: [letter],
      check: (assignment) => {
        const value = assignment.get(letter);
        return value !== undefined && value !== 0;
      },
      description: `${letter} !== 0`,
    });
  }

  // 3. Column-Wise Modulo Evaluation 
  // Evaluates every single column sequentially directly as variables become available.
  const posMod = (n: number, m: number) => ((n % m) + m) % m;
  
  for (let i = 0; i < maxLen; i++) {
    const colLetters = new Set<string>();
    for (let j = 0; j <= i; j++) {
      const c1 = len1 - 1 - j >= 0 ? puzzle.operand1[len1 - 1 - j] : null;
      const c2 = len2 - 1 - j >= 0 ? puzzle.operand2[len2 - 1 - j] : null;
      const cRes = resLen - 1 - j >= 0 ? puzzle.result[resLen - 1 - j] : null;
      if (c1) colLetters.add(c1);
      if (c2) colLetters.add(c2);
      if (cRes) colLetters.add(cRes);
    }

    constraints.push({
      variables: Array.from(colLetters), // Triggers the instant this specific column's letters are fully assigned!
      check: (assignment) => {
        const getSuffixVal = (word: string) => {
          let val = 0;
          let multiplier = 1;
          const charsToRead = Math.min(word.length, i + 1);
          for (let k = 0; k < charsToRead; k++) {
            const char = word[word.length - 1 - k];
            val += assignment.get(char)! * multiplier;
            multiplier *= 10;
          }
          return val;
        };

        const suffix1 = getSuffixVal(puzzle.operand1);
        const suffix2 = getSuffixVal(puzzle.operand2);
        const suffixRes = getSuffixVal(puzzle.result);
        const mod = Math.pow(10, i + 1);

        switch (puzzle.operation) {
          case '+':
            return posMod(suffix1 + suffix2, mod) === posMod(suffixRes, mod);
          case '-':
            return posMod(suffix1 - suffix2, mod) === posMod(suffixRes, mod);
          case '*':
            return posMod(suffix1 * suffix2, mod) === posMod(suffixRes, mod);
          default:
            return false;
        }
      },
      description: `Col ${i} Modulo Check`,
    });
  }

  return { variables, constraints };
}

export function assignmentToWords(
  puzzle: CryptArithmeticPuzzle,
  assignment: Map<string, number>
): {
  operand1: string;
  operand2: string;
  result: string;
  num1?: number;
  num2?: number;
  numResult?: number;
} {
  const wordToDisplay = (word: string) => {
    return word
      .split('')
      .map(letter => {
        const value = assignment.get(letter);
        return value !== undefined ? value.toString() : letter;
      })
      .join('');
  };

  const wordToNumber = (word: string) => {
    let num = 0;
    for (const letter of word) {
      const digit = assignment.get(letter);
      if (digit === undefined) return undefined;
      num = num * 10 + digit;
    }
    return num;
  };

  return {
    operand1: wordToDisplay(puzzle.operand1),
    operand2: wordToDisplay(puzzle.operand2),
    result: wordToDisplay(puzzle.result),
    num1: wordToNumber(puzzle.operand1),
    num2: wordToNumber(puzzle.operand2),
    numResult: wordToNumber(puzzle.result),
  };
}
