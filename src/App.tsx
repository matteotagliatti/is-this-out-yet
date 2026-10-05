import { useRef, useState } from "react"
import MovieSearch from "@/components/movie-search"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { countries, countryLabel } from "@/lib/countries"
import {
  getWatchProviders,
  providerLogoUrl,
  type CountryWatchOptions,
  type Movie,
  type WatchProvider,
  type WatchProviders,
} from "@/lib/tmdb"

const providerGroups: {
  key: keyof CountryWatchOptions
  label: string
}[] = [
  { key: "stream", label: "Stream" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
  { key: "free", label: "Free" },
  { key: "ads", label: "Ads" },
]

function ProviderList({ providers }: { providers: WatchProvider[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {providers.map((provider) => (
        <li
          className="flex items-center gap-2 text-sm"
          key={provider.providerId}
        >
          {provider.logoPath ? (
            <img
              alt=""
              className="size-8 rounded-md"
              src={providerLogoUrl(provider.logoPath)}
            />
          ) : null}
          <span>{provider.providerName}</span>
        </li>
      ))}
    </ul>
  )
}

export function App() {
  const [country, setCountry] = useState("US")
  const [movie, setMovie] = useState<Movie | null>(null)
  const [providers, setProviders] = useState<WatchProviders | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  function handleSelect(next: Movie | null) {
    const id = ++requestId.current
    setMovie(next)
    setProviders(null)
    setError(null)

    if (!next) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    getWatchProviders(next.id)
      .then((result) => {
        if (requestId.current === id) setProviders(result)
      })
      .catch(() => {
        if (requestId.current === id) {
          setError("Couldn't load where to watch this movie.")
          setProviders(null)
        }
      })
      .finally(() => {
        if (requestId.current === id) setIsLoading(false)
      })
  }

  const selectedCountry = countryLabel(country)
  const countryOptions = providers?.results[country]
  const groups = providerGroups
    .map((group) => ({
      ...group,
      providers: countryOptions?.[group.key] ?? [],
    }))
    .filter((group) => group.providers.length > 0)

  return (
    <div className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-md min-w-0 flex-col gap-6">
        <h1 className="font-heading text-2xl font-semibold">
          Is this out yet?
        </h1>

        <Field className="w-full" name="country">
          <FieldLabel>Country</FieldLabel>
          <Select
            items={countries}
            onValueChange={(value) => {
              if (value) setCountry(value)
            }}
            value={country}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {countries.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Field>

        <Field className="w-full" name="movie">
          <FieldLabel>Movie</FieldLabel>
          <MovieSearch onSelect={handleSelect} />
        </Field>

        {movie ? (
          <Card>
            <CardHeader>
              <CardTitle>{movie.title}</CardTitle>
              <CardDescription>
                {movie.year ? `${movie.year} · ` : null}
                {selectedCountry}
              </CardDescription>
            </CardHeader>
            <CardPanel>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" />
                  Checking availability...
                </div>
              ) : null}

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              {!isLoading && !error && groups.length === 0 ? (
                <Empty className="px-0 py-4 md:py-6">
                  <EmptyHeader>
                    <EmptyTitle>Not available</EmptyTitle>
                    <EmptyDescription>
                      Not available in {selectedCountry}.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              {!isLoading && !error && groups.length > 0 ? (
                <div className="flex flex-col">
                  {groups.map((group, index) => (
                    <div key={group.key}>
                      {index > 0 ? <Separator className="my-4" /> : null}
                      <div className="flex flex-col gap-3">
                        <Badge variant="secondary">{group.label}</Badge>
                        <ProviderList providers={group.providers} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardPanel>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default App
