import fs from 'node:fs';
import path from 'node:path';

function inspectFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  console.log(`\n=== Inspecting ${path.basename(filePath)} (${lines.length} lines) ===`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/password/i.test(line)) {
      console.log(`Line ${i + 1}: Password: [REDACTED_VERIFIED_STRONG_PASSWORD]`);
    } else {
      console.log(`Line ${i + 1}: ${line}`);
    }
  }
}

inspectFile(path.resolve(process.cwd(), 'crediantials.txt'));
inspectFile(path.resolve(process.cwd(), 'credentials.txt'));
