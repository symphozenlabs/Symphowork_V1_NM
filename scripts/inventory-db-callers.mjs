import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const helpers = new Set(['withTenantTransaction', 'withPlatformTransaction', 'withUserTransaction',
  'withInvitationTokenTransaction', 'withVerifiedRequestUser', 'withVerifiedTenantTransaction',
  'withVerifiedOrganizationTransaction', 'tenantRead', 'tenantApiRead', 'platformRead']);
function* sources(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* sources(path);
    else if (entry.name.endsWith('.ts') && !/\.(test|spec)\.ts$/.test(path)) yield path;
  }
}
const rows = [];
for (const path of sources('src')) {
  const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node, owner) {
    if (ts.isFunctionDeclaration(node) && node.name) owner = node.name.text;
    if (ts.isVariableDeclaration(node) && node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer) ||
       (ts.isCallExpression(node.initializer) && node.initializer.arguments.some(ts.isArrowFunction)
        && node.initializer.expression.getText(file) === 'cache'))) owner = node.name.getText(file);
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(file);
      if (helpers.has(callee) || /^(db\.(select|update|insert|delete|execute|transaction)|db\.query\.\w+\.\w+|database\(\)\.\w+)$/.test(callee)) {
        rows.push({ path: path.replaceAll('\\','/'), line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
          enclosing: owner, operation: callee });
      }
    }
    ts.forEachChild(node, child => visit(child, owner));
  }
  visit(file, '<module>');
}
console.log(JSON.stringify(rows, null, 2));
