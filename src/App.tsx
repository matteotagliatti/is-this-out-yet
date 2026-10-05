import { useQuery } from "@tanstack/react-query"
import { CalendarPlusIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useState } from "react"
import { CircleFlag } from "react-circle-flags"
import MovieSearch, { MoviePoster } from "@/components/movie-search"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { addReleaseToCalendar } from "@/lib/calendar"
import { countries, countryLabel } from "@/lib/countries"
import {
  getReleaseDates,
  getWatchProviders,
  providerLogoUrl,
  releaseForCountry,
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

const themes = [
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
  { icon: MonitorIcon, label: "System", value: "system" },
] as const

function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()
  const ActiveIcon =
    themes.find((item) => item.value === theme)?.icon ?? MonitorIcon

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label={`Theme, ${theme}`}
            className="size-9"
            size="icon"
            variant="outline"
          />
        }
      >
        <ActiveIcon aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuRadioGroup
          onValueChange={(value) => {
            if (value === "light" || value === "dark" || value === "system") {
              setTheme(value)
            }
          }}
          value={theme}
        >
          {themes.map((item) => (
            <MenuRadioItem closeOnClick key={item.value} value={item.value}>
              <span className="flex items-center gap-2">
                <item.icon aria-hidden="true" />
                {item.label}
              </span>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
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
  const unavailable =
    movieId != null && providersQuery.isSuccess && groups.length === 0
  const releaseQuery = useQuery({
    enabled: unavailable,
    queryFn: () => {
      if (movieId == null) throw new Error("Missing movie")
      return getReleaseDates(movieId)
    },
    queryKey: ["digital-release-dates", movieId],
  })
  const release = releaseForCountry(releaseQuery.data, country)

  return (
    <div className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-md min-w-0 flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              Is this 🎬 out yet?
            </h1>
            <p className="text-sm text-muted-foreground">
              Search for a movie and see where you can watch it in the country
              you pick.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeSwitcher />
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
        </div>

        <Field className="w-full" name="movie">
          <FieldLabel>Movie</FieldLabel>
          <MovieSearch onSelect={setMovie} />
        </Field>

        {movie ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <MoviePoster posterPath={movie.posterPath} />
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle>{movie.title}</CardTitle>
                <CardDescription>
                  {movie.year ? `${movie.year} · ` : null}
                  {selectedCountry}
                </CardDescription>
              </div>
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
                releaseQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Checking the digital release date...
                  </div>
                ) : (
                  <Empty className="px-0 py-4 md:py-6">
                    <EmptyHeader>
                      <EmptyTitle>
                        {release?.upcoming ? "Not out yet" : "Not available"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {releaseQuery.isError
                          ? `Couldn't load the digital release date for ${selectedCountry}.`
                          : release?.upcoming
                            ? `Digital release in ${selectedCountry} on ${release.date}.`
                            : release
                              ? `Digital release in ${selectedCountry} was ${release.date}.`
                              : `No digital release date in ${selectedCountry} yet.`}
                      </EmptyDescription>
                    </EmptyHeader>
                    {release?.upcoming ? (
                      <EmptyContent>
                        <Button
                          onClick={() =>
                            addReleaseToCalendar({
                              country: selectedCountry,
                              isoDate: release.isoDate,
                              movieId: movie.id,
                              title: movie.title,
                            })
                          }
                          type="button"
                          variant="outline"
                        >
                          <CalendarPlusIcon aria-hidden="true" />
                          Add to Calendar
                        </Button>
                      </EmptyContent>
                    ) : null}
                  </Empty>
                )
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
