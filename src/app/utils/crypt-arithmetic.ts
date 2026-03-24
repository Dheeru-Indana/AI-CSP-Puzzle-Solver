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
  // Extract unique letters
  const letters = new Set<string>();
  [...puzzle.operand1, ...puzzle.operand2, ...puzzle.result].forEach(letter => {
    letters.add(letter);
  });

  const letterArray = Array.from(letters);

  // Create variables (each letter can be 0-9)
  const variables: CSPVariable[] = letterArray.map(letter => ({
    name: letter,
    domain: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  }));

  const constraints: CSPConstraint[] = [];

  // All different constraint
  constraints.push({
    variables: letterArray,
    check: (assignment) => {
      const values = Array.from(assignment.values());
      return new Set(values).size === values.length;
    },
    description: 'All letters must have different values',
  });

  // Leading zeros constraint
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
      description: `${letter} cannot be 0 (leading digit)`,
    });
  }

  // Arithmetic constraint
  constraints.push({
    variables: letterArray,
    check: (assignment) => {
      // Convert words to numbers
      const wordToNumber = (word: string) => {
        let num = 0;
        for (const letter of word) {
          const digit = assignment.get(letter);
          if (digit === undefined) return null;
          num = num * 10 + digit;
        }
        return num;
      };

      const num1 = wordToNumber(puzzle.operand1);
      const num2 = wordToNumber(puzzle.operand2);
      const result = wordToNumber(puzzle.result);

      if (num1 === null || num2 === null || result === null) {
        return true; // Can't check yet
      }

      switch (puzzle.operation) {
        case '+':
          return num1 + num2 === result;
        case '-':
          return num1 - num2 === result;
        case '*':
          return num1 * num2 === result;
        default:
          return false;
      }
    },
    description: `${puzzle.operand1} ${puzzle.operation} ${puzzle.operand2} = ${puzzle.result}`,
  });

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
