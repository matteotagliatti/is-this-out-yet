"use client"

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
import { searchMovies, type Movie } from "@/lib/tmdb"

export default function MovieSearch({
  onSelect,
}: {
  onSelect: (movie: Movie | null) => void
}) {
  const [searchValue, setSearchValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)
  const highlightedRef = useRef<Movie | undefined>(undefined)
  const selectedTitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (!searchValue || searchValue === selectedTitleRef.current) return

    let ignore = false
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchMovies(searchValue)
        if (!ignore) setSearchResults(results)
      } catch {
        if (!ignore) {
          setError("Failed to fetch movies. Please try again.")
          setSearchResults([])
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      ignore = true
    }
  }, [searchValue])

  let status: ReactNode = `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} found`
  if (isLoading) {
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
  } else if (searchResults.length === 0 && searchValue) {
    status = (
      <span className="text-sm font-normal text-muted-foreground">
        No movies found for "{searchValue}"
      </span>
    )
  }

  const shouldRenderPopup = searchValue !== ""

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
          if (value) {
            setIsLoading(true)
            setError(null)
            setSearchResults([])
          } else {
            setSearchResults([])
            setIsLoading(false)
            setError(null)
          }
        }
      }}
      value={searchValue}
    >
      <AutocompleteInput
        aria-label="Search movies"
        className="w-full"
        placeholder="Search for a movie"
      />
      {shouldRenderPopup && (
        <AutocompletePopup aria-busy={isLoading || undefined}>
          <AutocompleteStatus className="text-muted-foreground">
            {status}
          </AutocompleteStatus>
          <AutocompleteList>
            {(movie: Movie) => (
              <AutocompleteItem key={movie.id} value={movie}>
                <div className="flex w-full flex-col gap-1">
                  <div className="font-medium">{movie.title}</div>
                  {movie.year ? (
                    <div className="text-xs text-muted-foreground">
                      {movie.year}
                    </div>
                  ) : null}
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      )}
    </Autocomplete>
  )
}
