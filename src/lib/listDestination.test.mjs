import assert from "node:assert/strict";
import { test } from "node:test";
import { searchFilters } from "./searchFilters.ts";
const destination = "7c73829c-b4bb-461a-8804-187257f0b0fb";
const source = "3f1c9d2a-5b7e-4a61-9c48-2d6e8f0a1b33";
function filters(entries) {
 const data = new URLSearchParams(entries);
 return searchFilters((k) => data.get(k) ?? undefined, (k) => data.getAll(k));
}
test("bulk-list destination does not narrow the source search to existing members", () => {
 const original = filters({state:"NY",taxonomy_classification:"Internal Medicine",status:"active"});
 const submitted = filters({state:"NY",taxonomy_classification:"Internal Medicine",status:"active",destination_list_id:destination});
 assert.deepEqual(submitted, original);
 assert.equal(submitted.list_id, undefined);
});
test("an explicit source-list filter remains distinct from the destination", () => {
 const submitted = filters({list_id:source,destination_list_id:destination,state:"NY"});
 assert.equal(submitted.list_id, source);
 assert.notEqual(submitted.list_id, destination);
});
