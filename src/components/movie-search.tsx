"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompleteStatus,
} from "@/components/ui/autocomplete"
import { Spinner } from "@/components/ui/spinner"
import { posterUrl, searchMovies, type Movie } from "@/lib/tmdb"

export function MoviePoster({ posterPath }: { posterPath: string | null }) {
  if (!posterPath) {
    return (
      <div
        aria-hidden="true"
        className="h-12 w-8 shrink-0 rounded-sm bg-muted"
      />
    )
  }

  return (
    <img
      alt=""
      className="h-12 w-8 shrink-0 rounded-sm object-cover"
      src={posterUrl(posterPath)}
    />
  )
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debounced
}

export default function MovieSearch({
  onSelect,
}: {
  onSelect: (movie: Movie | null) => void
}) {
  const [searchValue, setSearchValue] = useState("")
  const highlightedRef = useRef<Movie | undefined>(undefined)
  const selectedTitleRef = useRef<string | null>(null)
  const debouncedQuery = useDebouncedValue(searchValue.trim(), 300)
  const moviesQuery = useQuery({
    enabled: debouncedQuery.length > 0,
    placeholderData: keepPreviousData,
    queryFn: () => searchMovies(debouncedQuery),
    queryKey: ["movies", debouncedQuery],
  })

  const hasQuery = searchValue.trim().length > 0
  const searchResults =
    hasQuery && !moviesQuery.isError ? (moviesQuery.data ?? []) : []
  const isSearching =
    hasQuery &&
    !moviesQuery.isError &&
    (searchValue.trim() !== debouncedQuery || moviesQuery.isFetching)
  const error = moviesQuery.isError
    ? "Failed to fetch movies. Please try again."
    : null

  let status: ReactNode = `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} found`
  if (isSearching) {
    status = (
      <span className="flex items-center justify-between gap-2 text-muted-foreground">
        Searching...
        <Spinner className="size-4.5 sm:size-4" />
      </span>
    )
  } else if (error) {
    status = (
      <span className="text-sm font-normal text-destructive">{error}</span>
    )
  } else if (searchResults.length === 0 && hasQuery) {
    status = (
      <span className="text-sm font-normal text-muted-foreground">
        No movies found for "{searchValue}"
      </span>
    )
  }

  return (
    <Autocomplete
      filter={null}
      items={searchResults}
      itemToStringValue={(item: Movie) => item.title}
      onItemHighlighted={(movie) => {
        if (movie) highlightedRef.current = movie
      }}
      onValueChange={(value, details) => {
        setSearchValue(value)

        if (details.reason === "item-press") {
          const highlighted = highlightedRef.current
          const movie =
            highlighted && highlighted.title === value
              ? highlighted
              : searchResults.find((item) => item.title === value)
          if (movie) {
            selectedTitleRef.current = movie.title
            onSelect(movie)
          }
          return
        }

        if (value === selectedTitleRef.current) return

        if (
          details.reason === "input-change" ||
          details.reason === "input-clear" ||
          details.reason === "clear-press"
        ) {
          selectedTitleRef.current = null
          onSelect(null)
        }
      }}
      value={searchValue}
    >
      <AutocompleteInput
        aria-label="Search movies"
        className="w-full"
        placeholder="Search for a movie"
      />
      {hasQuery && (
        <AutocompletePopup aria-busy={isSearching || undefined}>
          <AutocompleteStatus className="text-muted-foreground">
            {status}
          </AutocompleteStatus>
          <AutocompleteList>
            {(movie: Movie) => (
              <AutocompleteItem key={movie.id} value={movie}>
                <div className="flex w-full items-center gap-2">
                  <MoviePoster posterPath={movie.posterPath} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="font-medium">{movie.title}</div>
                    {movie.year ? (
                      <div className="text-xs text-muted-foreground">
                        {movie.year}
                      </div>
                    ) : null}
                  </div>
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      )}
    </Autocomplete>
  )
}
