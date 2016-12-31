import test from 'tape';

import { Token } from './types';
import { operatorToTokenMapping,
         toNumberToken,
         toOperatorToken,
         tokenize } from './tokenizer';

test('toNumberToken create Token.Number from 123.4', tape => {
    tape.plan(2);
    const token = toNumberToken('123.4');
    tape.ok(token instanceof Token.Number);
    tape.equal(token.value, 123.4);
});

test('toOperatorToken create operator tokens from +, -, *, /', tape => {
    tape.plan(4);
    const plus = toOperatorToken('+');
    const minus = toOperatorToken('-');
    const multiplication = toOperatorToken('*');
    const division = toOperatorToken('/');
    tape.ok(plus == Token.Plus);
    tape.ok(minus == Token.Minus);
    tape.ok(multiplication == Token.Multiply);
    tape.ok(division == Token.Division);
});

test('tokenize should tokenize "1 + 1"', tape => {
    tape.plan(1);
    tape.deepEqual(tokenize('1 + 1'), [
        Token.Number(1),
        Token.Plus,
        Token.Number(1)
    ]);
});

test('tokenize should tokenize parenthesis', tape => {
    tape.plan(1);
    tape.deepEqual(tokenize('(1 + 1 )'), [
        Token.LeftParenthesis,
        Token.Number(1),
        Token.Plus,
        Token.Number(1),
        Token.RightParenthesis
    ]);
});

test('tokenize should tokenize "1/999*1.2 +40*3-0.1"', tape => {
    tape.plan(1);
    tape.deepEqual(tokenize('1/999*1.2 +40*3-0.1'), [
        Token.Number(1),
        Token.Division,
        Token.Number(999),
        Token.Multiply,
        Token.Number(1.2),
        Token.Plus,
        Token.Number(40),
        Token.Multiply,
        Token.Number(3),
        Token.Minus,
        Token.Number(0.1)
    ]);
});

test('tokenize should not tokenize "a"', tape => {
    tape.plan(1);
    try {
        tape.throws(tokenize('a'));
    } catch(e) {
        tape.pass();
    }
});
