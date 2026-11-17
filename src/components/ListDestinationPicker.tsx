"use client";

import { useState } from "react";

type Choice = { id: string; name: string; member_count: number };

export default function ListDestinationPicker({ initialValue, lists }: {
  initialValue: string;
  lists: Choice[];
}) {
  const [selected, setSelected] = useState(initialValue);
  return <>
    <label htmlFor="add-list" className="sr-only">Which list</label>
    <select id="add-list" name="list_id" form="add-to-list" value={selected}
      onChange={(event) => setSelected(event.target.value)}>
      {lists.length > 0 && <option value="">Choose a list...</option>}
      {lists.map((list) => <option key={list.id} value={list.id}>
        {list.name} ({list.member_count.toLocaleString("en-US")})
      </option>)}
      <option value="new">New list...</option>
    </select>
    {/* Destination is not a source-search list filter. Keep both form owners in sync. */}
    <input type="hidden" name="destination_list_id" form="add-all-to-list" value={selected} />
  </>;
}
