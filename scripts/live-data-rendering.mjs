/** Prevent successful builds that permanently package API-failure fallbacks.
 * Source guard, not a full Next compiler: unrecognized patterns fail for review.
 * Covers direct value imports from lib/api and ancestor route configuration.
 * API calls hidden in other modules need their own review; build output is still evidence.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const parse = (file) => ts.createSourceFile(file, readFileSync(file,'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const exported = n => n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
function awaitedSearchParams(node, bindings) {
  if(ts.isAwaitExpression(node))return ts.isIdentifier(node.expression) && bindings.has(node.expression.text);
  // Accept the existing readValues(await searchParams) shape. Multiple arguments,
  // comma expressions and later declarations could execute a data fetch first.
  return ts.isCallExpression(node) && !node.questionDotToken && ts.isIdentifier(node.expression) &&
    node.arguments.length===1 && awaitedSearchParams(node.arguments[0],bindings);
}
function config(source, name) {
  for (const stmt of source.statements) {
    if (!exported(stmt) || !ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations)
      if (decl.name.getText(source) === name) return decl.initializer?.getText(source).replace(/^['"]|['"]$/g,'');
  }
}
function hasExport(source, name) {
  return source.statements.some(stmt =>
    (exported(stmt) && (stmt.name?.text === name ||
      (ts.isVariableStatement(stmt) && stmt.declarationList.declarations.some(d => d.name.getText(source) === name)))) ||
    (ts.isExportDeclaration(stmt) && (!stmt.exportClause ||
      (ts.isNamedExports(stmt.exportClause) && stmt.exportClause.elements.some(e => e.name.text === name)))));
}
function valueApiImport(source,file,app) {
  return source.statements.some(stmt => {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) return false;
    const spec=stmt.moduleSpecifier.text;
    const target=(spec.startsWith('.')?resolve(dirname(file),spec):spec).replace(/\.[cm]?[jt]sx?$/,'');
    if (target !== '@/lib/api' && target !== resolve(app,'../lib/api')) return false;
    const clause=stmt.importClause;
    return !clause || (!clause.isTypeOnly && (clause.name || !clause.namedBindings ||
      ts.isNamespaceImport(clause.namedBindings) || clause.namedBindings.elements.some(e=>!e.isTypeOnly)));
  });
}
function leadingRequestBoundary(source) {
  const names=new Set();
  for(const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt) || stmt.moduleSpecifier.text !== 'next/server') continue;
    const clause=stmt.importClause;
    if(clause?.isTypeOnly)continue;
    const bindings=clause?.namedBindings;
    if(bindings && ts.isNamedImports(bindings)) for(const e of bindings.elements)
      if(!e.isTypeOnly && (e.propertyName?.text || e.name.text)==='connection')names.add(e.name.text);
  }
  const page=source.statements.find(s=>ts.isFunctionDeclaration(s) && s.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword));
  const first=page?.body?.statements[0];
  if(!first)return null;
  // Only accept a standalone, unconditional first await, never an unused import,
  // comment, nested helper, late call, conditional or unawaited connection().
  if(ts.isExpressionStatement(first) && ts.isAwaitExpression(first.expression)) {
    const call=first.expression.expression;
    if(ts.isCallExpression(call) && !call.questionDotToken && call.arguments.length===0 && ts.isIdentifier(call.expression) && names.has(call.expression.text))return 'connection';
  }
  const bindings=new Set();
  for(const param of page.parameters) if(ts.isObjectBindingPattern(param.name))
    for(const e of param.name.elements)if((e.propertyName?.getText(source)||e.name.getText(source))==='searchParams')bindings.add(e.name.getText(source));
  // The existing search page uses readValues(await searchParams) in its first initializer.
  const initializer=ts.isVariableStatement(first)?first.declarationList.declarations[0]?.initializer:null;
  if(initializer && awaitedSearchParams(initializer,bindings))return 'searchParams';
  return null;
}
export function auditLiveData(app=join(SITE,'src/app'), floor=17) {
  app=resolve(app);const pages=[];
  function scan(dir){for(const e of readdirSync(dir,{withFileTypes:true})) {
    if(e.isDirectory() && !e.name.startsWith('_'))scan(join(dir,e.name));
    else if(e.isFile() && /^page\.[cm]?[jt]sx?$/.test(e.name))pages.push(join(dir,e.name));
  }}
  scan(app);const errors=[],inspected=[];
  for(const file of pages){
    const source=parse(file);
    if(source.parseDiagnostics.length)errors.push(`${relative(app,file)}: syntax could not be parsed; rendering safety cannot be established.`);
    if(!valueApiImport(source,file,app))continue;
    const path=relative(app,file).replaceAll('\\','/');
    const chain=[source];let dir=dirname(file);
    while(true){
      for(const name of ['layout.tsx','layout.ts','layout.jsx','layout.js'])if(existsSync(join(dir,name)))chain.push(parse(join(dir,name)));
      if(dir===app)break;dir=dirname(dir);
    }
    let reason=leadingRequestBoundary(source);
    if(chain.some(s=>['force-static','error'].includes(config(s,'dynamic'))))reason=null;
    else if(chain.some(s=>config(s,'dynamic')==='force-dynamic'))reason='force-dynamic';
    else if(!reason && /(^|\/)\[.+?\](\/|$)/.test(path) &&
      !chain.some(s=>hasExport(s,'generateStaticParams') || config(s,'dynamic')))reason='dynamic segment without static params';
    inspected.push({path,reason});
    if(!reason)errors.push(`${path}: live API page may prerender. Put await connection() first in the default page, or review its request-time boundary.`);
  }
  if(inspected.length<floor)errors.push(`Only ${inspected.length} API pages inspected; expected at least ${floor}. Review import discovery before changing this floor.`);
  return {inspected,errors};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=auditLiveData();
  if(result.errors.length){console.error('live-data-rendering:\n'+result.errors.join('\n'));process.exitCode=1;}
  else console.log(`live-data-rendering: ${result.inspected.length} API pages have request-time rendering boundaries.`);
}
