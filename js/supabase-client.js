import { createClient } from '@supabase/supabase-js';

// Lê as variáveis de ambiente injetadas pelo Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cria o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exporta o cliente para que outros arquivos possam usá-lo
export { supabase };