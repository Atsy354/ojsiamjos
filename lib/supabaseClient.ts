// lib/supabaseClient.ts
// Backward compatibility with old project
import { createClient } from './supabase/client'

export const supabase = createClient()
