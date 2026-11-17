import test from "node:test";
import assert from "node:assert/strict";
import { recordDate } from "./recordDate.ts";

test("record dates agree between UTC server and browsers across date boundaries", () => {
  const before = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/New_York", "Asia/Kolkata", "Pacific/Honolulu"]) {
      process.env.TZ = zone;
      assert.equal(recordDate("2024-06-13"), "Jun 13, 2024", zone);
      assert.equal(recordDate("2024-06-13T00:15:00Z"), "Jun 13, 2024", zone);
      assert.equal(recordDate("2024-06-13T00:15:00"), "Jun 13, 2024", zone);
      assert.equal(recordDate("2024-06-13T00:15:00+05:30"), "Jun 12, 2024", zone);
    }
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});

test("missing and invalid dates stay absent", () => {
  assert.equal(recordDate(null), null);
  assert.equal(recordDate(""), null);
  assert.equal(recordDate("not a date"), null);
});
