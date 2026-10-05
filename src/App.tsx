import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { CircleFlag } from "react-circle-flags"
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

function CountryLabel({ code, label }: { code: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <CircleFlag
        className="shrink-0"
        countryCode={code.toLowerCase()}
        height={16}
        width={16}
      />
      <span>{label}</span>
    </span>
  )
}

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
  const movieId = movie?.id ?? null
  const providersQuery = useQuery({
    enabled: movieId != null,
    queryFn: () => {
      if (movieId == null) throw new Error("Missing movie")
      return getWatchProviders(movieId)
    },
    queryKey: ["watch-providers", movieId],
  })

  const isLoading = providersQuery.isLoading
  const error = providersQuery.isError
    ? "Couldn't load where to watch this movie."
    : null
  const providers = providersQuery.data

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
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-2xl font-semibold">
            Is this 🎬 out yet?
          </h1>
          <Select
            items={countries}
            onValueChange={(value) => {
              if (value) setCountry(value)
            }}
            value={country}
          >
            <SelectTrigger
              aria-label={`Country, ${selectedCountry}`}
              className="size-9 w-9 min-w-0 shrink-0 justify-center px-0 [&_[data-slot=select-icon]]:hidden"
            >
              <SelectValue className="flex flex-none items-center">
                {(value: string | null) =>
                  value ? (
                    <CircleFlag
                      alt=""
                      countryCode={value.toLowerCase()}
                      height={20}
                      title={countryLabel(value)}
                      width={20}
                    />
                  ) : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              {countries.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <CountryLabel code={item.value} label={item.label} />
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <Field className="w-full" name="movie">
          <FieldLabel>Movie</FieldLabel>
          <MovieSearch onSelect={setMovie} />
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
