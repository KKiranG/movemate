Deno.serve(() => {
  return Response.json({
    received: true,
    function: "daily-expire-trips",
    next_steps: [
      "mark past-date listings as expired",
      "close stale trip supply",
      "keep matching fresh"
    ],
  });
});
