import fs from 'node:fs';
import path from 'node:path';

const credPath = path.resolve(process.cwd(), 'crediantials.txt');
const content = fs.readFileSync(credPath, 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/password/i.test(line)) {
    const parts = line.split(':');
    const pwd = parts.slice(1).join(':').trim();
    console.log(`Password line ${i + 1} stats: length=${pwd.length}, hasUpper=${/[A-Z]/.test(pwd)}, hasLower=${/[a-z]/.test(pwd)}, hasDigit=${/\d/.test(pwd)}, hasSpecial=${/[^A-Za-z0-9]/.test(pwd)}`);
  }
}
