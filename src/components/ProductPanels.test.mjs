import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Render the real public component with an overprivileged upstream response.
// Network and framework shells are stubbed; no backend or credentials are used.
const require = createRequire(import.meta.url);
const source = readFileSync(new URL("./ProductPanels.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} }).outputText;
const renderedModule = { exports: {} };
runInNewContext(compiled, {
  module: renderedModule, exports: renderedModule.exports,
  require(name) {
    if (name === "next/link") return function TestLink({ children, href, ...props }) { return React.createElement("a", { href, ...props }, children); };
    if (name === "@/components/ProductWindow") return {
      ProductWindow: ({ children, foot }) => React.createElement("section", null, children, foot),
      Unreachable: () => React.createElement("p", null, "Unavailable"),
    };
    if (name === "@/lib/api") return {};
    if (name === "@/lib/exportPresets") return { EXPORT_PRESETS: [], EXPORT_FORMATS: [] };
    return require(name);
  },
});

test("public provider card never renders contact email values returned upstream", () => {
  const html = renderToStaticMarkup(React.createElement(renderedModule.exports.RecordPanel, {
    row: { npi: "1234567890", name: "Example Provider", email: "private-test@example.invalid",
      email_trust_tier: "trusted", phone: "555-0100", city: "Example", state: "TX" },
  }));
  assert.ok(!html.includes("private-test@example.invalid"));
  assert.ok(html.includes("Sign in to reveal available contact details"));
  assert.ok(html.includes("555-0100"), "public practice phone remains available");
});

