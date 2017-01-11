import R from 'ramda';

import { Token, Expression } from './types';

// notEquals => Void -> Void -> Boolean
export const notEquals = R.compose(R.not, R.equals);

// tokenIsNumber => Token -> Boolean
// Checks if the given token is a number token.
export const tokenIsNumber = token => token instanceof Token.Number;

// tokenIsMinus => Token -> Boolean
export const tokenIsMinus = token => token === Token.Minus;

// tokenIsPlusOrMinus => Token -> Boolean
// Checks if token is plus or minus token.
export const tokenIsPlusOrMinus = token => token === Token.Plus || token === Token.Minus;

// tokenIsMultiply => Token -> Boolean
// Checks if token is multiplication token.
export const tokenIsMultiply = token => token === Token.Multiply;

// tokenIsDivision => Token -> Boolean
// Checks if token is division token.
export const tokenIsDivision = token => token === Token.Division;

// tokenIsMultiplyOrDivision => Token -> Boolean
// Checks if token is division or multiplication.
export const tokenIsMultiplyOrDivision = token =>
    tokenIsDivision(token) || tokenIsMultiply(token);

export const tokenIsOperator = token =>
    tokenIsPlusOrMinus(token) || tokenIsMultiplyOrDivision(token);

// isDivisionExpression => Expression -> Boolean
// Checks if the expression is division.
export const isDivisionExpression = expression =>
    tokenIsDivision(expression.operator);

export const expressionIsCalculation = expression =>
    expression instanceof Expression.Calculation;

export const tokenIsLeftParenthesis = token =>
    token === Token.LeftParenthesis;

export const tokenIsRightParenthesis = token =>
    token === Token.RightParenthesis;

// Token -> Token
// negates number tokens, if token is not number then it is plainly returned (error handling later)
export const negateToken = token =>
    token instanceof Token.Number ? Token.Number(-token.value) : token;

export const throwError = msg => {
    throw Error(msg);
};

// throw error if no tokens
export const throwIfEmpty = tokens => {
    if (R.isEmpty(tokens)) {
        throw Error('No valid calculation literals found.');
    }
    return tokens;
};

// finds out the index of matching right parenthesis recursively
// not that the starting left parenthesis is not included in tokens
// Token, Int, Int -> Int
export const getMatchingRightParenthesisIndex = (tokens, acc=0, level=0) => {
    const indexRight = tokens.indexOf(Token.RightParenthesis);
    const indexLeft = tokens.indexOf(Token.LeftParenthesis);
    if (R.equals(indexRight, -1)) {
        return -1;
    } else if(notEquals(indexLeft, -1) && R.lt(indexLeft, indexRight)) {
        // case sub parentheses
        return getMatchingRightParenthesisIndex(R.takeLast(tokens.length - (indexLeft + 1), tokens), acc + indexLeft  + 1, level + 1);
    } else if(notEquals(indexRight, -1) && notEquals(level, 0)) {
        // returning from sub parentheses
        return getMatchingRightParenthesisIndex(R.takeLast(tokens.length - (indexRight + 1), tokens), acc + indexRight + 1, level - 1);
    }
    return indexRight + acc;
};