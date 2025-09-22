// js/supabase-client.js

// Lê as variáveis de ambiente injetadas pelo Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Linha corrigida:
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);