function isToday(value: number | string | Date) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isThisYear(value: number | string | Date) {
  const date = new Date(value);
  const today = new Date();

  return date.getFullYear() === today.getFullYear();
}

export function formatCounterSeconds(seconds: number | string) {
  let isNeg = false;

  seconds = +seconds;

  if (isNaN(seconds) || !isFinite(seconds)) {
    seconds = 0;
  }

  if (seconds < 0) {
    seconds = Math.abs(seconds);
    isNeg = true;
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor((seconds % 3600) % 60);

  let r = s + "s"; // always show seconds
  r = m + "m " + r; // always show minutes
  if (h > 0) r = h + "h " + r; // only show hours if relevent

  return isNeg ? "-" + r : r;
}

function formatDateTime(value: number | string | Date): string {
  const date = new Date(value);

  return date.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(value: number | string | Date): string {
  const date = new Date(value);

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatAbsoluteDateTime(value: number | string | Date) {
  if (isToday(value)) {
    return formatTime(value);
  }

  if (isThisYear(value)) {
    return formatDateTime(value);
  }

  return formatDateTime(value);
}
