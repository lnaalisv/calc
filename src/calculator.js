
import R from 'ramda';

import { Token, Expression, ASTStep } from './types';
import { tokenize } from './tokenizer';
import { tokenToString, expressionToString, stepToString } from './debug';
import { notEquals,
         tokenIsMinus,
         tokenIsNumber,
         tokenIsLeftParenthesis,
         tokenIsOperator,
         tokenIsDivision,
         tokenIsMultiplyOrDivision,
         expressionIsCalculation,
         negateToken,
         throwIfEmpty,
         throwError } from './utils';

const { Calculation, Parenthesis, NegateParenthesis } = Expression;
const { Final, Step, ParseError } = ASTStep;

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

// convertToFinalIfNeeded => ASTStep -> ASTStep
// Converts the step to ASTStep.Final if there are no more tokens
export const convertToFinalIfNeeded = astStep =>
    astStep.cata({
        Final: R.always(astStep),
        ParseError: R.always(astStep),
        Step: (rootNode, tokens) => R.isEmpty(tokens) ? Final(rootNode) : astStep
    });

// replaceRootToken => ... -> Expression
// Replaces the root node with the new calculation
export const replaceRootToken = (rootNode, numberToken, operatorToken) =>
    Calculation(Calculation(rootNode.left,
                            rootNode.operator,
                            expressionIsCalculation(rootNode.right)
                                ? Calculation(rootNode.right.left, rootNode.right.operator, numberToken)
                                : numberToken),
                operatorToken,
                Expression.Empty);

// assocOperationToRightMostEmptyNode => ... -> Expression
// adds the new AST nodes either to root.right or to root.right.right
export const assocOperationToRightMostEmptyNode = (rootNode, numberToken, operatorToken) =>
    expressionIsCalculation(rootNode.right)
        ? Calculation(rootNode.left, rootNode.operator, Calculation(
            Calculation(rootNode.right.left, rootNode.right.operator, numberToken),
            operatorToken,
            Expression.Empty))
        : Calculation(rootNode.left, rootNode.operator, Calculation(numberToken, operatorToken, Expression.Empty));

// addCalculationToRootNode => ... -> Expression
export const addCalculationToRootNode = (rootNode, numberToken, operatorToken) =>
    operatorToken.cata({
        Plus: () => replaceRootToken(rootNode, numberToken, operatorToken),
        Minus: () => replaceRootToken(rootNode, numberToken, operatorToken),
        Multiply: () => tokenIsDivision(rootNode.operator)
                            ? replaceRootToken(rootNode, numberToken, operatorToken)
                            : assocOperationToRightMostEmptyNode(rootNode, numberToken, operatorToken),
        Division: () => tokenIsMultiplyOrDivision(rootNode.operator)
                            ? replaceRootToken(rootNode, numberToken, operatorToken)
                            : assocOperationToRightMostEmptyNode(rootNode, numberToken, operatorToken)
    });

// finalizeToRootNode => Expression, Token -> ASTStep
export const finalizeToRootNode = (rootNode, numberToken) =>
    rootNode.right === Expression.Empty
        ? Step(Calculation(rootNode.left, rootNode.operator, numberToken), [])
        : Step(Calculation(rootNode.left, rootNode.operator, Calculation(
              rootNode.right.left,
              rootNode.right.operator,
              numberToken
          )), []);

// astCalculationStep => ... -> ASTStep
// Adds the new calculation AST either to root/root.right or root.right.right according
// to the operation taken.
export const astCalculationStep = (rootNode, numberToken, operatorToken, restTokens) =>
    tokenIsOperator(operatorToken)
        ? rootNode
            ? Step(addCalculationToRootNode(rootNode, numberToken, operatorToken), restTokens)
            : Step(Calculation(numberToken, operatorToken, Expression.Empty), restTokens)
        : ParseError(`Token is not operator ${operatorToken}`);

// finalStep => Expression, Token -> ASTStep
export const finalStep = (rootNode, numberToken) =>
    rootNode ? finalizeToRootNode(rootNode, numberToken) : Step(Expression.Number(numberToken.value), []);

// parenthesisStep => Expression, Parenthesis constructor, [Token] -> ASTStep
export const parenthesisStep = (rootNode, parenthesisConstructor, tokens) => {
    const matchingIndex = getMatchingRightParenthesisIndex(tokens);
    if (matchingIndex === -1) {
        return ParseError('Matching parentheses not found');
    } else if(matchingIndex === 0) {
        return ParseError('Empty parenthesis found');
    }
    // the right parenthesis is the first token of remainingTokens
    const [ subTokens, remainingTokens ] = R.splitAt(matchingIndex, tokens);
    const parenthesisExpression = parenthesisConstructor(tokensToAST(subTokens));
    if (remainingTokens.length == 1) {
        // finalizing parenthesis expression
        return rootNode
            ? finalStep(rootNode, parenthesisExpression)
            : Step(parenthesisExpression, []);
    }
    return astCalculationStep(rootNode, parenthesisExpression, remainingTokens[1], R.takeLast(remainingTokens.length - 2, remainingTokens));
};

// negateParenthesisStep => Expression, Token, [Token] -> 
export const negateParenthesisStep = (rootNode, maybeParenthesis, restTokens) =>
    tokenIsLeftParenthesis(maybeParenthesis)
        ? parenthesisStep(rootNode, NegateParenthesis, restTokens)
        : ParseError(`Invalid token after negation ${tokenToString(maybeParenthesis)}`);

// numberOrOperatorStep => ... -> ASTStep
// Just a helper for processASTStep
export const numberOrOperatorStep = (rootNode, numberToken, operatorToken, restTokens) =>
    operatorToken ? astCalculationStep(rootNode, numberToken, operatorToken, restTokens) : finalStep(rootNode, numberToken);

// ASTStep -> ASTStep
// The main token parsing step function. Reads max 2 tokens and creates a new AST Step and returns it
export const processASTStep = ({ rootNode, tokens: [ firstToken, secondToken, thirdToken, ...restTokens ]}) => 
    firstToken
        ? R.cond([
                [ tokenIsMinus , () => tokenIsNumber(secondToken)
                                        ? numberOrOperatorStep(rootNode, negateToken(secondToken), thirdToken, restTokens)
                                        : negateParenthesisStep(rootNode, secondToken, [thirdToken, ...restTokens]) ],
                [ tokenIsNumber, () => numberOrOperatorStep(rootNode, firstToken, secondToken, [thirdToken, ...restTokens]) ],
                [ tokenIsLeftParenthesis, () => parenthesisStep(rootNode, Parenthesis, [secondToken, thirdToken,...restTokens])],
                [ R.T, () => ParseError(`First token of a step is not a number, negation or parenthesis: ${tokenToString(firstToken)}`) ]
            ])(firstToken)
        : Final(Expression.Empty);

// processASTSteps => ASTStep -> ASTStep.Final
// The main parsing function. Creates the AST tree and wraps it in ASTStep.Final
export const processASTSteps = astStep =>
    astStep.cata({
        Final: R.always(astStep),
        ParseError: R.always(astStep),
        Step: () => processASTSteps(convertToFinalIfNeeded(processASTStep(astStep)))
    });

// liftASTStep => [Token] -> ASTStep
export const liftASTStep = tokens =>
    ASTStep.Step(null, tokens);

// foldASTStep => ASTStep -> Expression
export const foldASTStep = astStep =>
    astStep.cata({
        ParseError: message => { throw Error(message); },
        Final: R.identity,
        Step: () => { throw Error('AST parsing finished suddenly without finalizing the AST'); }
    });

// tokensToAST => [ Token ] -> Expression
const tokensToAST = R.compose(foldASTStep, processASTSteps, liftASTStep)

// calculateAST => Expression -> Number
// Performs the calculations on the AST, returns the final result.
export const calculateAST = ast =>
    ast.cata({
        Number: R.identity,
        Parenthesis: expr => calculateAST(expr),
        NegateParenthesis: expr => R.negate(calculateAST(expr)),
        Calculation: (l, operator, r) => operator.cata({
            Plus: () => calculateAST(l) + calculateAST(r),
            Minus: () => calculateAST(l) - calculateAST(r),
            Multiply: () => calculateAST(l) * calculateAST(r),
            Division: () => R.equals(calculateAST(r), 0) ? throwError('Division by zero') : calculateAST(l) / calculateAST(r)
        })
    });

// calculate => String -> Number
// Calculates the result for the given calculation string
export const calculate = str =>
    R.compose(calculateAST, tokensToAST, throwIfEmpty, tokenize)(str);
