const interestPalette = [
  "bg-indigo-500/12 text-indigo-700",
  "bg-teal-500/12 text-teal-700",
  "bg-orange-500/12 text-orange-700",
  "bg-violet-500/12 text-violet-700",
  "bg-emerald-500/12 text-emerald-700",
  "bg-amber-500/12 text-amber-700",
  "bg-rose-500/12 text-rose-700",
  "bg-sky-500/12 text-sky-700",
];

export function interestTone(tag: string) {
  const hash = Array.from(tag.toLowerCase()).reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );

  return interestPalette[Math.abs(hash) % interestPalette.length];
}

export function impressMeStatusCopy(status: string) {
  switch (status) {
    case "Sent":
      return "Waiting for reply";
    case "Responded":
      return "New response";
    case "Viewed":
      return "Response reviewed";
    case "Accepted":
      return "Accepted";
    case "Declined":
      return "Passed";
    case "Expired":
      return "Expired";
    default:
      return status;
  }
}
