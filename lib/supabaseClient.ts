import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
        console.warn('Supabase environment variables are not set. Some features will not work.')
      }
      return createClient('https://placeholder.supabase.co', 'placeholder')
    })()
