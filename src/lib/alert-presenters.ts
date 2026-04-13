import type { ItemCategory } from "@/types/trip";
import type { UnmatchedRequest } from "@/types/alert";

export function buildRouteAlertSearchHref(params: {
  pickupSuburb: string;
  dropoffSuburb: string;
  preferredDate?: string | null;
  itemCategory?: ItemCategory | string | null;
  moveRequestId?: string | null;
  preferMoveRequest?: boolean;
}) {
  const query = new URLSearchParams();

  if (params.preferMoveRequest && params.moveRequestId) {
    query.set("moveRequestId", params.moveRequestId);
  }

  query.set("from", params.pickupSuburb);
  query.set("to", params.dropoffSuburb);

  if (params.preferredDate) {
    query.set("when", params.preferredDate);
  }

  if (params.itemCategory) {
    query.set("what", params.itemCategory);
  }

  return `/search?${query.toString()}`;
}

export function getRouteAlertPrimaryAction(routeRequest: UnmatchedRequest) {
  if (routeRequest.status === "matched") {
    return {
      href: buildRouteAlertSearchHref({
        pickupSuburb: routeRequest.pickupSuburb,
        dropoffSuburb: routeRequest.dropoffSuburb,
        preferredDate: routeRequest.preferredDate,
        itemCategory: routeRequest.itemCategory,
        moveRequestId: routeRequest.moveRequestId,
        preferMoveRequest: true,
      }),
      label: "Open recovered matches",
    };
  }

  return {
    href: buildRouteAlertSearchHref({
      pickupSuburb: routeRequest.pickupSuburb,
      dropoffSuburb: routeRequest.dropoffSuburb,
      preferredDate: routeRequest.preferredDate,
      itemCategory: routeRequest.itemCategory,
    }),
    label: routeRequest.status === "expired" ? "Search this corridor again" : "Search this route again",
  };
}
