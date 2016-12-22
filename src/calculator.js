
/*
  Expression = Number
  Expression = ( Expression )
  Expression = Expression Operator Expression

  Operator = '+' | '-' | '*' | '/'
*/

import R from 'ramda';
import daggy from 'daggy';

import { Token, tokenize } from './tokenizer';
import { tokenToString, expressionToString} from './debug';

// Types for Expressions
export const Expression = daggy.taggedSum({
    Number: ['value'],
    ParenthesisExpression: [ 'expression' ],
    Calculation: [ 'left', 'operator', 'right' ],
    Empty: []
});

// tokenIsNumber => Token -> Boolean
// Checks if the given token is a number token.
export const tokenIsNumber = token => token instanceof Token.Number;

// tokenIsPlusOrMinus => Token -> Boolean
// Checks if token is plus or minus token.
export const tokenIsPlusOrMinus = token => token === Token.Plus || token === Token.Minus;

// tokenIsMultiplication => Token -> Boolean
// Checks if token is multiplication token.
export const tokenIsMultiplication = token => token === Token.Multiplication;

// tokenIsDivision => Token -> Boolean
// Checks if token is division token.
export const tokenIsDivision = token => token === Token.Division;

// tokenIsMultiplicationOrDivision => Token -> Boolean
// Checks if token is division or multiplication.
export const tokenIsMultiplicationOrDivision = token =>
    tokenIsDivision(token) || tokenIsMultiplication(token);

// isDivisionExpression => Expression -> Boolean
// Checks if the expression is division.
export const isDivisionExpression = expression =>
    tokenIsDivision(expression.operator);

// plusAndMinusToAST => Expression, Expression, Token, Token, [Token] -> Expression
// A helper for tokensToAST
// Creates AST for plus and minus.
const plusAndMinusToAST = (precedentExpression, currentExpression, numberToken, operatorToken, restTokens) => {
    let newExpression;

    if (precedentExpression) {
        if (precedentExpression.right !== Expression.Empty) {
            currentExpression.right = numberToken;
        } else {
            precedentExpression.right = numberToken;
        }
        newExpression = Expression.Calculation(precedentExpression, operatorToken, Expression.Empty);
    } else {
        newExpression = Expression.Calculation(numberToken, operatorToken, Expression.Empty);
    }

    return tokensToAST(newExpression, newExpression, restTokens);
};

// divideAndMultiplyToAST => Expression, Expression, Token, Token, [Token] -> Expression
// A helper for tokensToAST
// Creates AST for division and multiply
export const divideAndMultiplyToAST = (precedentExpression, currentExpression, numberToken, operatorToken, restTokens) => {
    // multiplication or division
    const newExpression = Expression.Calculation(numberToken, operatorToken, Expression.Empty);

    if (currentExpression) {
        currentExpression.right = newExpression;
        return tokensToAST(precedentExpression, newExpression, restTokens);
    }
    return tokensToAST(newExpression, newExpression, restTokens);
};

// finishingTokenToAST => Expression, Expression, Token -> Expression
// A helper for tokensToAST, processes the last token of the given token set.
// If we have an unfinished expression, puts the last token to the right operand.
// Otherwise just returns the number.
export const finishingTokenToAST = (precedentExpression, currentExpression, numberToken) => {
    // last token of the given input
    if (currentExpression) {
        // complete the expression
        currentExpression.right = numberToken;
        return precedentExpression;
    }
    // we don't have an expression, only numer
    return Expression.Number(numberToken.value)
}

// tokensToAST => Expression -> Expression -> [Token] -> Expression
// Recursive way to create an AST from the given list of tokens
// Processes tokens a number and an operator at one time
export const tokensToAST = R.curry((precedentExpression, currentExpression, [ firstToken, ...tokens]) => {

    // peek ahead to see the operator
    const operatorToken = R.head(tokens);

    // expect the first token to be a number token
    if(tokenIsNumber(firstToken)) {
        // invert divisions to multiplication
        if (currentExpression && isDivisionExpression(currentExpression)) {
            currentExpression.operator = Token.Multiplication;
            firstToken = Token.Number(1/firstToken.value);
        }
        // three cases
        // 1. Next operation is + or -
        // 2. Next operation is * or /
        // 3. No next operation, possibly a finishing token to a previous operation
        if (tokenIsPlusOrMinus(operatorToken)) {
            return plusAndMinusToAST(precedentExpression, currentExpression, firstToken, operatorToken, R.tail(tokens));
        } else if(tokenIsMultiplicationOrDivision(operatorToken)) {
            return divideAndMultiplyToAST(precedentExpression, currentExpression, firstToken, operatorToken, R.tail(tokens));
        }
        return finishingTokenToAST(precedentExpression, currentExpression, firstToken);
    } else {
        throw Error('Parse error: ' + firstToken);
    }
});

// calculateAST => Expression -> Number
// Performs the calculations on the AST, returns the final result.
export const calculateAST = ast =>
    ast.cata({
        Number: R.identity,
        Calculation: (l, operator, r) => operator.cata({
            Plus: () => calculateAST(l) + calculateAST(r),
            Minus: () => calculateAST(l) - calculateAST(r),
            Multiplication: () => calculateAST(l) * calculateAST(r),
            Division: () => calculateAST(l) / calculateAST(r)
        })
    });

// calculate => String -> Number
// Calculates the result for the given calculation string
export const calculate = str =>
    R.compose(calculateAST, tokensToAST(null, null), tokenize)(str);
