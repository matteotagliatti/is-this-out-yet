export type Movie = {
  id: number
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

const TMDB_API = "https://api.themoviedb.org/3"

type TmdbMovie = {
  id: number
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

export async function searchMovies(query: string): Promise<Movie[]> {
  const data = await tmdb<TmdbSearchResponse>("/search/movie", {
    include_adult: "false",
    query,
  })

  return data.results
    .filter((movie) => movie.title)
    .map((movie) => ({
      id: movie.id,
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
