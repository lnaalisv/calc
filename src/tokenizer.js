import R from 'ramda';
import daggy from 'daggy';

export const operators = '+-*/';
export const parentheses = '()';

export const Token = daggy.taggedSum({
    Number: ['value'],
    LeftParenthesis: [],
    RightParenthesis: [],
    Plus: [],
    Minus: [],
    Multiplication: [],
    Division: [],
    Empty: []
});

export const operatorToTokenMapping = {
    '+': Token.Plus,
    '-': Token.Minus,
    '*': Token.Multiplication,
    '/': Token.Division,
    '(': Token.LeftParenthesis,
    ')': Token.RightParenthesis
};

// String -> [Char]
export const splitExpression = str => str.split('');

export const isOperator = char => operators.indexOf(char) !== -1;

export const isParenthesis = char => parentheses.indexOf(char) !== -1;

export const isNumber = str => !isNaN(parseFloat(str)) && isFinite(str);

export const isNotWhitespace = str => str !== ' ';

export const filterWhitespace = R.filter(isNotWhitespace);

export const toNumberToken = str => Token.Number(parseFloat(str));

export const toOperatorToken = str => operatorToTokenMapping[str];

// [Char] -> [Token]
export const tokenizeSplitted = splitted => {
    const originalTokens = splitted.join('');
    const tokens = [];
    let stack = '';

    while(splitted.length > 0) {
        const current = splitted.shift();

        if (isOperator(current) || isParenthesis(current)) {
            if(stack){
                tokens.push(toNumberToken(stack));
                stack = '';
            }
            tokens.push(toOperatorToken(current));
        } else if(isNumber(stack + current)) {
            stack += current;

            if(splitted.length == 0) {
                tokens.push(toNumberToken(stack));
            }
        } else {
            throw Error(`Cannot parse ${originalTokens}, invalid token ${current}.`);
        }
    };

    return tokens;
};

// String -> [Token]
export const tokenize = expression =>
    R.compose(tokenizeSplitted, filterWhitespace, splitExpression)(expression);
