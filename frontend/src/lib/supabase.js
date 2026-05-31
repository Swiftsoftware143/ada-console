import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

export const DEFAULT_PROFILES = {
  epilepsy: false,
  cognitive: false,
  adhd: false,
  blindness: false,
  visImpaired: false,
}

export const DEFAULT_FEATURES = {
  readableFont: false,
  dyslexia: false,
  highlightTitles: false,
  highlightLinks: false,
  stopAnimations: false,
  muteSounds: false,
  hideImages: false,
  virtualKeyboard: false,
  readingGuide: false,
  readingMask: false,
}

export const PROFILE_LABELS = {
  epilepsy: "Epilepsy Safe",
  cognitive: "Cognitive Disability",
  adhd: "ADHD Friendly",
  blindness: "Blindness Mode",
  visImpaired: "Visually Impaired",
}

export const FEATURE_LABELS = {
  readableFont: "Readable Font",
  dyslexia: "Dyslexia Friendly",
  highlightTitles: "Highlight Titles",
  highlightLinks: "Highlight Links",
  stopAnimations: "Stop Animations",
  muteSounds: "Mute Sounds",
  hideImages: "Hide Images",
  virtualKeyboard: "Virtual Keyboard",
  readingGuide: "Reading Guide",
  readingMask: "Reading Mask",
}
