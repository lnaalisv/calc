import R from 'ramda';

import { Token } from './types';
import { throwError } from './utils';

export const operators = '+-*/';
export const parentheses = '()';

// mapping from char to token
export const operatorToTokenMapping = {
    '+': Token.Plus,
    '-': Token.Minus,
    '*': Token.Multiply,
    '/': Token.Division,
    '(': Token.LeftParenthesis,
    ')': Token.RightParenthesis
};

export const isParenthesisOrOperator = char =>
    operators.indexOf(char) !== -1 || parentheses.indexOf(char) !== -1;

export const isNumber = str => !isNaN(parseFloat(str)) && isFinite(str);

export const isNotWhitespace = c => !R.equals(' ', c);

export const filterWhitespace = R.filter(isNotWhitespace);

export const toNumberToken = str => Token.Number(parseFloat(str));

export const toOperatorToken = str => operatorToTokenMapping[str];

export const stackedIsNumber = (first, stack) => isNumber(stack + first);

// tokenizeFiltered => String, String -> [Token]
export const tokenizeFiltered = ([first, ...restChars], stack='') =>
    R.cond([
        [ R.isNil, () => [] ],
        [ isParenthesisOrOperator, () => R.isEmpty(stack)
                                            ? [ toOperatorToken(first), ...tokenizeFiltered(restChars, '')]
                                            : [ toNumberToken(stack), toOperatorToken(first), ...tokenizeFiltered(restChars, '')] ],
        [ stackedIsNumber, () => R.isEmpty(restChars)
                                            ? [ toNumberToken(stack + first) ]
                                            : [ ...tokenizeFiltered(restChars, stack + first) ] ],
        [ R.T, () => throwError(`Parse error at ${first}`) ],
    ])(first, stack);

// tokenize => String -> [Token]
export const tokenize = expression =>
    R.compose(tokenizeFiltered, filterWhitespace)(expression);
