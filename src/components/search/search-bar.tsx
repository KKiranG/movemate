import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTodayIsoDate } from "@/lib/utils";

export function SearchBar() {
  const defaultDate = getTodayIsoDate();

  return (
    <form
      action="/search"
      className="surface-card flex flex-col gap-3 p-4"
      aria-label="Search available trips"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Moving from</span>
          <Input
            name="from"
            placeholder="Penrith"
            defaultValue="Penrith"
            autoComplete="address-level2"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Moving to</span>
          <Input
            name="to"
            placeholder="Bondi"
            defaultValue="Bondi"
            autoComplete="address-level2"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">When</span>
          <Input name="when" type="date" defaultValue={defaultDate} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">What</span>
          <select
            name="what"
            defaultValue="furniture"
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <option value="furniture">Furniture</option>
            <option value="boxes">Boxes</option>
            <option value="appliance">Appliance</option>
            <option value="fragile">Fragile</option>
            <option value="other">Other</option>
          </select>
        </label>
        <Button type="submit" className="mt-auto gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </form>
  );
}
