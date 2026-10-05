export type Movie = {
  id: number
  posterPath: string | null
  title: string
  year: string | null
}

export type WatchProvider = {
  providerId: number
  providerName: string
  logoPath: string | null
}

export type CountryWatchOptions = {
  stream: WatchProvider[]
  rent: WatchProvider[]
  buy: WatchProvider[]
  free: WatchProvider[]
  ads: WatchProvider[]
}

export type WatchProviders = {
  id: number
  results: Record<string, CountryWatchOptions>
}

export type CountryRelease = {
  date: string
}

export type ReleaseDates = {
  id: number
  results: Record<string, CountryRelease[]>
}

export type MovieRelease = {
  date: string
  isoDate: string
  upcoming: boolean
}

const TMDB_API = "https://api.themoviedb.org/3"

type TmdbMovie = {
  id: number
  poster_path?: string | null
  title: string
  release_date?: string
}

type TmdbSearchResponse = {
  results: TmdbMovie[]
}

type TmdbProvider = {
  logo_path: string | null
  provider_id: number
  provider_name: string
  display_priority: number
}

type TmdbCountryProviders = {
  flatrate?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
  free?: TmdbProvider[]
  ads?: TmdbProvider[]
}

type TmdbWatchResponse = {
  id: number
  results: Record<string, TmdbCountryProviders>
}

type TmdbRelease = {
  release_date: string
  type: number
}

type TmdbReleaseDatesResponse = {
  id: number
  results: {
    iso_3166_1: string
    release_dates: TmdbRelease[]
  }[]
}

const digitalReleaseType = 4

function authHeaders(): HeadersInit {
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Missing VITE_TMDB_ACCESS_TOKEN")
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function tmdb<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${TMDB_API}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

function mapProviders(providers: TmdbProvider[] | undefined): WatchProvider[] {
  return (providers ?? [])
    .slice()
    .sort((a, b) => a.display_priority - b.display_priority)
    .map((provider) => ({
      logoPath: provider.logo_path,
      providerId: provider.provider_id,
      providerName: provider.provider_name,
    }))
}

export function providerLogoUrl(logoPath: string): string {
  return `https://image.tmdb.org/t/p/w45${logoPath}`
}

export function posterUrl(posterPath: string): string {
  return `https://image.tmdb.org/t/p/w92${posterPath}`
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const data = await tmdb<TmdbSearchResponse>("/search/movie", {
    include_adult: "false",
    query,
  })

  return data.results
    .filter((movie) => movie.title)
    .map((movie) => ({
      id: movie.id,
      posterPath: movie.poster_path ?? null,
      title: movie.title,
      year: movie.release_date ? movie.release_date.slice(0, 4) : null,
    }))
}

export async function getWatchProviders(
  movieId: number
): Promise<WatchProviders> {
  const data = await tmdb<TmdbWatchResponse>(
    `/movie/${movieId}/watch/providers`
  )

  const results: Record<string, CountryWatchOptions> = {}
  for (const [country, options] of Object.entries(data.results)) {
    results[country] = {
      ads: mapProviders(options.ads),
      buy: mapProviders(options.buy),
      free: mapProviders(options.free),
      rent: mapProviders(options.rent),
      stream: mapProviders(options.flatrate),
    }
  }

  return { id: data.id, results }
}

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function formatReleaseDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function releaseForCountry(
  dates: ReleaseDates | undefined,
  country: string
): MovieRelease | null {
  const releases = dates?.results[country]
  if (!releases?.length) return null

  const today = todayKey()
  const upcoming = releases
    .filter((release) => release.date.slice(0, 10) > today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const chosen =
    upcoming[0] ??
    [...releases].sort((a, b) => a.date.localeCompare(b.date)).at(-1)

  if (!chosen) return null

  return {
    date: formatReleaseDate(chosen.date),
    isoDate: chosen.date.slice(0, 10),
    upcoming: chosen.date.slice(0, 10) > today,
  }
}

export async function getReleaseDates(movieId: number): Promise<ReleaseDates> {
  const data = await tmdb<TmdbReleaseDatesResponse>(
    `/movie/${movieId}/release_dates`
  )

  const results: Record<string, CountryRelease[]> = {}
  for (const country of data.results) {
    results[country.iso_3166_1] = country.release_dates
      .filter(
        (release) => release.type === digitalReleaseType && release.release_date
      )
      .map((release) => ({
        date: release.release_date,
      }))
  }

  return { id: data.id, results }
}
