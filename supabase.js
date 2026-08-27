import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  'https://jvsaoordipmzogmtnodi.supabase.co'

const supabaseKey =
  'sb_publishable_-bHfalURpkP7xnvrbkcgOQ_ToVXuXEo'

export const supabase =
  createClient(supabaseUrl, supabaseKey)