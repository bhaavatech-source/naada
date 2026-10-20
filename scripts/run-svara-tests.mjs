import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const projectRoot = process.cwd();
const entry = path.join(projectRoot, 'src/music/__tests__/svaraMapping.test.ts');
const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'naada-svara-tests-'));
const visited = new Set();

function resolveLocalImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && /\.tsx?$/.test(candidate)) return candidate;
  }
  return null;
}

function collect(file) {
  const absolute = path.resolve(file);
  if (visited.has(absolute)) return;
  visited.add(absolute);
  const sourceText = fs.readFileSync(absolute, 'utf8');
  const sourceFile = ts.createSourceFile(absolute, sourceText, ts.ScriptTarget.Latest, true);
  for (const statement of sourceFile.statements) {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const dependency = resolveLocalImport(absolute, statement.moduleSpecifier.text);
      if (dependency) collect(dependency);
    }
  }
}

function emittedPath(sourcePath) {
  return path.join(outputRoot, path.relative(projectRoot, sourcePath)).replace(/\.tsx?$/, '.js');
}

try {
  collect(entry);
  for (const sourcePath of visited) {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: sourcePath,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    const errors = (result.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
    if (errors.length) {
      throw new Error(errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
    }
    let javascript = result.outputText.replace(
      /(from\s*['"])(\.{1,2}\/[^'"]+?)(['"])/g,
      (_match, before, specifier, after) => `${before}${/\.js$/.test(specifier) ? specifier : `${specifier}.js`}${after}`,
    );
    const destination = emittedPath(sourcePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, javascript);
  }

  fs.writeFileSync(path.join(outputRoot, 'package.json'), '{"type":"module"}');
  const compiledEntry = emittedPath(entry);
  const run = spawnSync(process.execPath, [compiledEntry], { stdio: 'inherit' });
  if (run.error) throw run.error;
  if (run.status !== 0) process.exitCode = run.status ?? 1;
} catch (error) {
  console.error('[FAIL] Svara test runner:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  fs.rmSync(outputRoot, { recursive: true, force: true });
}
