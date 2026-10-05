function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
}

function nextDateKey(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + 1))
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0")
  const nextDay = String(date.getUTCDate()).padStart(2, "0")
  return `${date.getUTCFullYear()}${nextMonth}${nextDay}`
}

export function buildReleaseCalendarEvent({
  country,
  isoDate,
  movieId,
  title,
}: {
  country: string
  isoDate: string
  movieId: number
  title: string
}): string {
  const start = isoDate.replaceAll("-", "")
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}/, "")

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Is this out yet//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:digital-release-${movieId}-${country}-${start}@is-this-out-yet`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextDateKey(isoDate)}`,
    `SUMMARY:${escapeIcsText(`${title} digital release`)}`,
    `DESCRIPTION:${escapeIcsText(`Digital release in ${country}.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

export function addReleaseToCalendar(event: {
  country: string
  isoDate: string
  movieId: number
  title: string
}) {
  const file = new File(
    [buildReleaseCalendarEvent(event)],
    `${event.title} digital release.ics`,
    { type: "text/calendar" }
  )
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
