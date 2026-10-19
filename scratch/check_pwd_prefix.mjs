import fs from 'node:fs';
import path from 'node:path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'crediantials.txt'), 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/password/i.test(line)) {
    const key = line.split(':')[0];
    console.log(`Line ${i + 1} prefix: "${key}:"`);
  }
}
