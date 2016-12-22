import { calculate, calculateAST } from './calculator';
import { tokenize } from './tokenizer';

const args = process.argv;

if(args.length != 3) {
    console.log('Invalid number of arguments.');
    console.log('Usage e.g. "npm start \"3 * 3 + 4\"');
    process.exit(1);
}

const calculation = args[2];
const result = calculate(calculation);
console.log(`${calculation} = ${result}`);
