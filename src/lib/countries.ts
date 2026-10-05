export type Country = {
  label: string
  value: string
}

export const countries: Country[] = [
  { label: "United States", value: "US" },
  { label: "Italy", value: "IT" }
]

export function countryLabel(code: string): string {
  return countries.find((country) => country.value === code)?.label ?? code
}
