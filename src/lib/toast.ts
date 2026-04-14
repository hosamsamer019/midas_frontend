"use client"

import * as React from "react"

// Simple toast notification helper (no external dependencies)
export const toast = {
  success: function(message: string) {
    console.log("Success:", message)
  },
  error: function(message: string) {
    console.error("Error:", message)
  },
  info: function(message: string) {
    console.log("Info:", message)
  }
}
