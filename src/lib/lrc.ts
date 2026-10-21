
export interface LrcLine {
  seconds: number;
  text: string;
}

export function parseLrc(content: string): LrcLine[] {
  const lines: LrcLine[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const match = rawLine.match(
      /^\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/
    );

    if (!match) continue;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = match[3] ?? "0";

    if (seconds >= 60) continue;

    const timestamp =
      minutes * 60 +
      seconds +
      Number(fraction) / 10 ** fraction.length;

    lines.push({
      seconds: timestamp,
      text: match[4].trim(),
    });
  }

  return lines.sort((a, b) => a.seconds - b.seconds);
}
