export type Country = {
  label: string
  value: string
}

export const countries: Country[] = [
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "Canada", value: "CA" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Italy", value: "IT" },
  { label: "Spain", value: "ES" },
  { label: "Brazil", value: "BR" },
  { label: "Mexico", value: "MX" },
  { label: "Japan", value: "JP" },
  { label: "South Korea", value: "KR" },
  { label: "India", value: "IN" },
  { label: "Netherlands", value: "NL" },
  { label: "Sweden", value: "SE" },
  { label: "Norway", value: "NO" },
  { label: "Denmark", value: "DK" },
  { label: "Poland", value: "PL" },
  { label: "Portugal", value: "PT" },
  { label: "Ireland", value: "IE" },
  { label: "New Zealand", value: "NZ" },
  { label: "Argentina", value: "AR" },
  { label: "Switzerland", value: "CH" },
  { label: "Belgium", value: "BE" },
  { label: "Austria", value: "AT" },
  { label: "Finland", value: "FI" },
]

export function countryLabel(code: string): string {
  return countries.find((country) => country.value === code)?.label ?? code
}
