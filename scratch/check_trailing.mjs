import fs from 'node:fs';
import path from 'node:path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'crediantials.txt'), 'utf8');
console.log('Ends with newline:', content.endsWith('\n'));
console.log('Last 20 chars has newline:', content.slice(-20).includes('\n'));
