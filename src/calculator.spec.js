import test from 'tape';

import { Token, Expression, ASTStep } from './types';
import { calculate,
         getMatchingRightParenthesisIndex,
         calculateAST,
         processASTStep,
         convertToFinalIfNeeded } from './calculator';

const {
    Minus,
    Plus,
    Multiply,
    Division,
    LeftParenthesis,
    RightParenthesis
} = Token;

const {
    Calculation
} = Expression;

// getMatchingRightParenthesisIndex

test('expect getMatchingRightParenthesisIndex to return -1 if there are no matching parentheses', tape => {
    tape.plan(4);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus]), -1);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus, LeftParenthesis, RightParenthesis]), -1);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus, LeftParenthesis, Plus, RightParenthesis]), -1);
    tape.equal(getMatchingRightParenthesisIndex([LeftParenthesis, Minus, LeftParenthesis, Plus, RightParenthesis]), -1);
});

test('expect getMatchingRightParenthesisIndex to return index of matching parentheses', tape => {
    tape.plan(5);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus, RightParenthesis]), 2);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus, LeftParenthesis, RightParenthesis, RightParenthesis]), 4);
    tape.equal(getMatchingRightParenthesisIndex([RightParenthesis, Plus, Minus, LeftParenthesis, Plus, RightParenthesis]), 0);
    tape.equal(getMatchingRightParenthesisIndex([LeftParenthesis, Minus, LeftParenthesis, Plus, RightParenthesis, RightParenthesis, RightParenthesis]), 6);
    tape.equal(getMatchingRightParenthesisIndex([
        LeftParenthesis,
        Minus,
        RightParenthesis,
        Plus,
        LeftParenthesis,
        Plus,
        RightParenthesis,
        LeftParenthesis,
        RightParenthesis,
        LeftParenthesis,
        RightParenthesis,
        RightParenthesis,
        Plus,
        Plus]), 11);
});

// convertToFinalIfNeeded

test('expect convertToFinalIfNeeded to assign root to ASTStep.Final if there are no more tokens', tape => {
    tape.plan(1);
    const tokens = []
    const rootNode = Calculation(Expression.Number(1), Plus, Expression.Number(1));
    const step = ASTStep.Step(rootNode, tokens);
    tape.deepEqual(convertToFinalIfNeeded(step), ASTStep.Final(rootNode));
});

test('expect convertToFinalIfNeeded to do nothing if there are more tokens', tape => {
    tape.plan(1);
    const tokens = [ Plus ]
    const rootNode = Calculation(Expression.Number(1), Plus, Expression.Number(1));
    const step = ASTStep.Step(rootNode, tokens);
    tape.deepEqual(convertToFinalIfNeeded(step), ASTStep.Step(rootNode, tokens));
});

// processASTStep

test('expect processASTStep to return Expression.Empty when there are no tokens', tape => {
    tape.plan(1);
    const tokens = [];
    const nextStep = processASTStep(ASTStep.Step(null, tokens));
    const shouldBeStep = ASTStep.Final(Expression.Empty);
    tape.deepEqual(nextStep, shouldBeStep);
});


test('expect processASTStep to process 1+1 with 1 remaining token', tape => {
    tape.plan(1);
    const tokens = [ Token.Number(1), Token.Plus, Token.Number(1) ];
    const nextStep = processASTStep(ASTStep.Step(null, tokens));
    const shouldBeStep = ASTStep.Step(
        Calculation(
            Expression.Number(1),
            Plus,
            Expression.Empty
        ), [ Token.Number(1) ]
    );
    tape.deepEqual(nextStep, shouldBeStep);
});

test('expect processASTStep twice to process 1+1 should leave no remaining tokens', tape => {
    tape.plan(1);
    const tokens = [ Token.Number(1), Token.Plus, Token.Number(1) ];
    const nextStep = processASTStep(processASTStep(ASTStep.Step(null, tokens)));
    const shouldBeStep = ASTStep.Step(
        Calculation(
            Expression.Number(1),
            Plus,
            Expression.Number(1)
        ), []
    );
    tape.deepEqual(nextStep, shouldBeStep);
});

test('expect processASTStep to process 1+1+1 with 1+1 as remaining tokens', tape => {
    tape.plan(1);
    const tokens = [ Token.Number(1), Plus, Token.Number(1), Plus, Token.Number(1) ];
    const nextStep = processASTStep(ASTStep.Step(null, tokens));
    const shouldBeStep = ASTStep.Step(
        Calculation(
            Expression.Number(1),
            Plus,
            Expression.Empty
        ), [ Token.Number(1), Plus, Token.Number(1) ]
    );
    tape.deepEqual(nextStep, shouldBeStep);
});

test('expect processASTStep three times to process 1+1+1 with no remaining tokens', tape => {
    tape.plan(1);
    const tokens = [ Token.Number(1), Plus, Token.Number(1), Plus, Token.Number(1) ];
    const nextStep = processASTStep(processASTStep(processASTStep(ASTStep.Step(null, tokens))));
    const shouldBeStep = ASTStep.Step(
        Calculation(
            Calculation(
                Expression.Number(1),
                Plus,
                Expression.Number(1)
            ),
            Plus,
            Expression.Number(1)
        ), []
    );
    tape.deepEqual(nextStep, shouldBeStep);
});

// calculateAST

test('calculateAST should calculate a simple AST', tape => {
    tape.plan(1);
    const ast = Expression.Calculation(Expression.Number(1), Token.Plus, Expression.Number(2));
    tape.equal(calculateAST(ast), 3);
});

test('calculateAST should calculate multiplications', tape => {
    tape.plan(1);
    const ast = Expression.Calculation(
        Expression.Number(3),
        Token.Multiply,
        Expression.Number(2)
    );
    tape.equal(calculateAST(ast), 6);
});

test('calculateAST should calculate divisions', tape => {
    tape.plan(1);
    const ast = Expression.Calculation(
        Expression.Number(3),
        Token.Division,
        Expression.Number(2)
    );
    tape.equal(calculateAST(ast), 3/2);
});

test('calculateAST should calculate a more comples AST', tape => {
    tape.plan(1);
    const ast = Expression.Calculation(
        Expression.Calculation(Expression.Number(1), Token.Plus, Expression.Number(2)),
        Token.Minus,
        Expression.Number(2)
    );
    tape.equal(calculateAST(ast), 1);
});

// calculate
test('expect calculate to throw on parsing error', tape => {
    tape.plan(6);
    try {
        tape.throws(calculate('1+'));
    } catch(e) {
        tape.pass();
    }

    try {
        tape.throws(calculate('1+1-'));
    } catch(e) {
        tape.pass();
    }

    try {
        tape.throws(calculate('-'));
    } catch(e) {
        tape.pass();
    }

   try {
        tape.throws(calculate('()'));
    } catch(e) {
        tape.pass();
    }

    try {
        tape.throws(calculate('(1+1'));
    } catch(e) {
        tape.pass();
    }

    try {
        tape.throws(calculate('1+1)'));
    } catch(e) {
        tape.pass();
    }
});

test('expect calculate to succeed on simple calculations', tape => {
    tape.plan(8);
    tape.equal(calculate('1+1'), 2);
    tape.equal(calculate('1+2+3+4'), 10);

    tape.equal(calculate('1-1'), 0);
    tape.equal(calculate('1-4-10'), -13);

    tape.equal(calculate('2*3'), 6);
    tape.equal(calculate('2*3*4'), 24);

    tape.equal(calculate('6/12'), 0.5);
    tape.equal(calculate('6/12/2'), 0.25);
});

test('expect calculate to succeed on longer calculations', tape => {
    tape.plan(9);

    tape.equal(calculate('2*2*2*2*2*2*2*2'), 256);
    tape.equal(calculate('1+2*2*2*2*2*2*2*2+1'), 258);

    tape.equal(calculate('1+2*3*4/6'), 5);
    tape.equal(calculate('1+2/4*2*5'), 6);

    tape.equal(calculate('1+2*3*4+1'), 26);
    tape.equal(calculate('1+2*3*4-1'), 24);

    tape.equal(calculate('1+2/4/8*16+1'), 3);
    tape.equal(calculate('1+2/4/8*16/2'), 1.5);

    tape.equal(calculate('1-1/128*0.5*123-1'), -0.48046875);
});

test('expect calculate to succeed on calculations with parenthesis', tape => {
    tape.plan(9);

    tape.equal(calculate('(1+1)'), 2);
    tape.equal(calculate('(((1+1)))'), 2);
    tape.equal(calculate('(((1+1)))+1'), 3);
    tape.equal(calculate('(((1+1)))*2'), 4);
    tape.equal(calculate('(((1+1)))*(((1+1)))'), 4);
    tape.equal(calculate('(((1+1)))/(((1+1)))'), 1);
    tape.equal(calculate('(1+1)*2'), 4);
    tape.equal(calculate('2*(1+1)'), 4);
    tape.equal(calculate('2*(3+(4/(1+1)))/(9+1)'), 1);
});


test('expect calculate to succeed on just numbers', tape => {
    tape.plan(5);

    tape.equal(calculate('1'), 1);
    tape.equal(calculate('(1)'), 1);
    tape.equal(calculate('(1)+1'), 2);
    tape.equal(calculate('1+(1)'), 2);
    tape.equal(calculate('(1)+(1)'), 2);;
});

test('expect calculate to succeed on negations', tape => {
    tape.plan(4);

    tape.equal(calculate('-1*2'), -2);
    tape.equal(calculate('(-1)*2'), -2);
    tape.equal(calculate('-(1)*2'), -2);
    tape.equal(calculate('2*-(3*4)'), -24);

});
