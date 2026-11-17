// Run with `npm test` (node --test; Node strips the types from names.ts on import).
import assert from "node:assert/strict";
import { test } from "node:test";
import { titleCase } from "./names.ts";

const cases = [
  ["HCA HEALTHCARE", "HCA Healthcare"],
  ["ST. LUKE'S HOSPITAL OF KANSAS CITY LLC", "St. Luke's Hospital of Kansas City LLC"],
  ["UPMC", "UPMC"],
  ["CHRISTUS SANTA ROSA", "Christus Santa Rosa"],
  ["BAYLOR SCOTT & WHITE", "Baylor Scott & White"],
  ["SSM HEALTH", "SSM Health"],
  ["CHI ST. VINCENT", "CHI St. Vincent"],
  ["ACME HOLDINGS, INC.", "Acme Holdings, Inc."],
  ["SMITH FAMILY PRACTICE PLLC", "Smith Family Practice PLLC"],
  ["JOHN SMITH MD PA", "John Smith MD PA"],
  ["HENRY FORD HEALTH SYSTEM III", "Henry Ford Health System III"],
  ["VA MEDICAL CENTER", "VA Medical Center"],
  ["THE CHILDREN'S HOSPITAL OF THE KING'S DAUGHTERS", "The Children's Hospital of the King's Daughters"],
  ["O'BRIEN AND D'ANGELO DDS", "O'Brien and D'Angelo DDS"],
  ["MCALLEN MEDICAL CENTER", "McAllen Medical Center"],
  ["WINSTON-SALEM REHAB", "Winston-Salem Rehab"],
  ["CENTER FOR SPINE AT THE LAKE", "Center for Spine at the Lake"],
  ["OF COUNSEL HEALTH", "Of Counsel Health"],
  ["KANSAS CITY, MO", "Kansas City, MO"],
  ["MO HEALTH PARTNERS", "Mo Health Partners"],
  ["123 N MAIN ST STE 200", "123 N Main St Ste 200"],
  ["1ST CHOICE HOME HEALTH", "1st Choice Home Health"],
  ["2100 DR MARTIN LUTHER KING JR BLVD", "2100 Dr Martin Luther King Jr Blvd"],
  ["LYNN COUNTY HOSPITAL", "Lynn County Hospital"],
  ["U.S. PHYSICAL THERAPY", "U.S. Physical Therapy"],
];

test("all-caps names are cased for display", () => {
  for (const [input, expected] of cases) assert.equal(titleCase(input), expected, input);
});

test("mixed-case input is left alone", () => {
  assert.equal(titleCase("McKesson Specialty Care"), "McKesson Specialty Care");
  assert.equal(titleCase("iCare LLC"), "iCare LLC");
});

test("empty input is an empty string", () => {
  assert.equal(titleCase(null), "");
  assert.equal(titleCase(undefined), "");
  assert.equal(titleCase(""), "");
});

test("spacing is kept as filed", () => {
  assert.equal(titleCase("MERCY  HOSPITAL"), "Mercy  Hospital");
});
