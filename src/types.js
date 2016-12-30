import daggy from 'daggy';

// types for tokens
export const Token = daggy.taggedSum({
    Number: ['value'],
    LeftParenthesis: [],
    RightParenthesis: [],
    Plus: [],
    Minus: [],
    Multiply: [],
    Division: [],
    Empty: []
});

// Types for Expressions
/*
  Expression = Number
  Expression = Expression Operator Expression

  Operator = '+' | '-' | '*' | '/'
*/
export const Expression = daggy.taggedSum({
    Number: ['value'],
    Parenthesis: ['expression'],
    NegateParenthesis: [ 'expression' ],
    Calculation: [ 'left', 'operator', 'right' ],
    Empty: []
});

// Represents a step of creating the AST from tokens
// Final is the last step, no more tokens left
// Step is some step before the last step
// If there is an error during AST creation, the functions should return ParseError
export const ASTStep = daggy.taggedSum({
    Final: [ 'rootNode' ],
    Step: [ 'rootNode', 'tokens' ],
    ParseError: [ 'message' ]
});