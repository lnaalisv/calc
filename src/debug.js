import R from 'ramda';

export const tokenToString = token => token.cata({
    Number: val => val.toString(),
    Plus: () => "+",
    Minus: () => "-",
    Multiplication: () => "*",
    Division: () => "/",
    Empty: () => "Empty"
});

export const expressionToString = expr => expr ? expr.cata({
    Number: R.identity,
    Empty: () => 'X',
    Calculation: (l, c, r) => c.cata({
        Plus: () => `{ ${expressionToString(l)} + ${expressionToString(r)} }`,
        Minus: () => `{ ${expressionToString(l)} - ${expressionToString(r)} }`,
        Division: () => `{ ${expressionToString(l)} / ${expressionToString(r)} }`,
        Multiplication: () => `{ ${expressionToString(l)} * ${expressionToString(r)} }`
    })
}) : 'Empty';