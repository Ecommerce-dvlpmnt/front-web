"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

function getTheme(): Theme {
  const storedTheme = window.localStorage.getItem("theme")

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("themechange", onStoreChange)

  return () => window.removeEventListener("themechange", onStoreChange)
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light")
  const isDark = theme === "dark"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  function toggleTheme() {
    const nextTheme: Theme = isDark ? "light" : "dark"

    window.localStorage.setItem("theme", nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    window.dispatchEvent(new Event("themechange"))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
      title={isDark ? "Світла тема" : "Темна тема"}
      onClick={toggleTheme}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
