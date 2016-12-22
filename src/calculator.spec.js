import test from 'tape';

import { calculate,
         calculateAST,
         tokensToAST,
         Expression } from './calculator';
import { Token } from './tokenizer';

const {
    Minus,
    Plus,
    Multiplication,
    Division
} = Token;

const {
    Calculation
} = Expression;

// tokensToAST

test('tokensToAST should not edit the original tokens', tape => {
    tape.plan(1);

    const tokens = [
        Token.Number(1),
        Minus,
        Token.Number(2),
        Multiplication,
        Token.Number(3)
    ];

    const copyTokens = [ ...tokens ];

    tokensToAST(null, null, tokens);
    tape.deepEqual(copyTokens, tokens);
});

test('tokensToAST should make an AST from [1, +, 2]', tape => {
    tape.plan(1);
    const tokens = [
        Token.Number(1),
        Token.Plus,
        Token.Number(2)
    ];

    const ast = Expression.Calculation(Expression.Number(1), Token.Plus, Expression.Number(2));
    tape.deepEqual(tokensToAST(null, null, tokens), ast);
});

test('tokensToAST should make an AST from [1, +, 2, -, 2]', tape => {
    tape.plan(1);

    const tokens = [
        Token.Number(1),
        Token.Plus,
        Token.Number(2),
        Token.Minus,
        Token.Number(2)
    ];

    const ast = Expression.Calculation(
        Expression.Calculation(Expression.Number(1), Token.Plus, Expression.Number(2)),
        Token.Minus,
        Expression.Number(2)
    );
    tape.deepEqual(tokensToAST(null, null, tokens), ast);
});

test('tokensToAST should make an AST from [1, -, 2, *, 3]', tape => {
    tape.plan(1);

    const tokens = [
        Token.Number(1),
        Minus,
        Token.Number(2),
        Multiplication,
        Token.Number(3)
    ];

    const ast = Calculation(
        Expression.Number(1),
        Minus,
        Calculation(
            Expression.Number(2),
            Multiplication,
            Expression.Number(3)
        )
    );
    tape.deepEqual(tokensToAST(null, null, tokens), ast);
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
        Token.Multiplication,
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
test('expect calculate to calculate "1 + 1"', tape => {
    tape.plan(1);
    tape.equal(calculate('1+1'), 2);
});

test('expect calculate to calculate "2*2*2*2*2*2*2*2"', tape => {
    tape.plan(1);
    tape.equal(calculate('2*2*2*2*2*2*2*2'), 256);
});

test('expect calculate to calculate "1-1/128*0.5*123-1"', tape => {
    tape.plan(1);
    tape.equal(calculate('1-1/128*0.5*123-1'), -0.48046875);
});
