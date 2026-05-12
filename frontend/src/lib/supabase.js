import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const DEFAULT_PROFILES = {
  epilepsy: false,
  cognitive: false,
  adhd: false,
  blindness: false,
  visImpaired: false,
};

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
};

export const PROFILE_LABELS = {
  epilepsy: "Epilepsy Safe",
  cognitive: "Cognitive Disability",
  adhd: "ADHD Friendly",
  blindness: "Blindness Mode",
  visImpaired: "Visually Impaired",
};

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
};
