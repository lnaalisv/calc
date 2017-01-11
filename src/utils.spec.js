import test from 'tape';

import { Token } from './types';
import { getMatchingRightParenthesisIndex } from './utils';

const {
    Minus,
    Plus,
    LeftParenthesis,
    RightParenthesis
} = Token;

// getMatchingRightParenthesisIndex

test('expect getMatchingRightParenthesisIndex to return -1 if there are no matching parentheses', tape => {
    tape.plan(4);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus]), -1);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus, LeftParenthesis, RightParenthesis]), -1);
    tape.equal(getMatchingRightParenthesisIndex([Plus, Minus, LeftParenthesis, Plus, RightParenthesis]), -1);
    tape.equal(getMatchingRightParenthesisIndex([LeftParenthesis, Minus, LeftParenthesis, Plus, RightParenthesis]), -1);
});

test('expect getMatchingRightParenthesisIndex to return index of matching parentheses', tape => {
    tape.plan(6);
    tape.equal(getMatchingRightParenthesisIndex([Plus, LeftParenthesis, Plus, RightParenthesis, RightParenthesis, Plus]), 4);
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
