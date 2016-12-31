import R from 'ramda';

export const tokenToString = token => { console.log('tokenToString ' + token);return token ? token.cata({
    Number: val => val.toString(),
    Plus: () => '+',
    Minus: () => '-',
    Multiply: () => '*',
    Division: () => '/',
    Empty: () => 'Empty',
    LeftParenthesis: () => '(',
    RightParenthesis: () => ')'
}) : "Null token";};

export const expressionToString = expr => expr ? expr.cata({
    Number: R.identity,
    Empty: () => 'X',
    Parenthesis: expr => `(${expressionToString(expr)})`,
    NegateParenthesis: expr => `-(${expressionToString(expr)})`,
    Calculation: (l, c, r) => c.cata({
        Plus: () => `{ ${expressionToString(l)} + ${expressionToString(r)} }`,
        Minus: () => `{ ${expressionToString(l)} - ${expressionToString(r)} }`,
        Division: () => `{ ${expressionToString(l)} / ${expressionToString(r)} }`,
        Multiply: () => `{ ${expressionToString(l)} * ${expressionToString(r)} }`
    })
}) : 'Empty';

export const stepToString = step => step ? step.cata({
    ParseError: message => `[ParseError: ${message}]`,
    Step: (rootNode, tokens) => `Step # ${expressionToString(rootNode)} # Tokens: ${tokens.map(tokenToString)}`,
    Final: rootNode => `Final Step ### ${expressionToString(rootNode)} ###`
}) : 'Empty Step';