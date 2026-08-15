import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

function getUser() {
  return supabase?.auth.getUser().then(({ data }) => data.user) ?? Promise.resolve(null);
}

function getSession() {
  return supabase?.auth.getSession().then(({ data }) => data.session) ?? Promise.resolve(null);
}

async function signInWithPassword(email, password) {
  if (!supabase) return { error: new Error("Supabase authentication is not configured.") };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, error };
}

async function signUpWithPassword(email, password, fullName) {
  if (!supabase) return { error: new Error("Supabase authentication is not configured.") };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined
    }
  });
  return { user: data.user, session: data.session, error };
}

async function signInWithGoogle() {
  if (!supabase) return { error: new Error("Supabase authentication is not configured.") };
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}#dashboard`
    }
  });
}

async function signOut() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

function requireConfigured() {
  return supabase ? null : new Error("Supabase authentication is not configured.");
}

function toSavedCardRow(card, userId) {
  return {
    id: card.id,
    user_id: userId,
    name: card.name || "Untitled rate card",
    slug: card.slug || null,
    url: card.url || null,
    payload: card.payload || [],
    phone: card.phone || null,
    country: card.country || {},
    currency: card.currency || {},
    include_business_name: card.includeBusinessName !== false,
    include_currency: card.includeCurrency !== false,
    business_image: card.businessImage || "",
    created_at: card.createdAt || new Date().toISOString(),
    updated_at: card.updatedAt || new Date().toISOString()
  };
}

function fromSavedCardRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    url: row.url,
    payload: row.payload,
    phone: row.phone,
    country: row.country,
    currency: row.currency,
    includeBusinessName: row.include_business_name,
    includeCurrency: row.include_currency,
    businessImage: row.business_image || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listSavedCards() {
  const configurationError = requireConfigured();
  if (configurationError) return { cards: [], error: configurationError };

  const { data, error } = await supabase
    .from("menuvv_rate_cards")
    .select("*")
    .order("updated_at", { ascending: false });
  return { cards: (data || []).map(fromSavedCardRow), error };
}

async function saveSavedCard(card) {
  const configurationError = requireConfigured();
  if (configurationError) return { error: configurationError };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: userError || new Error("You must be signed in to save cards.") };
  }

  const { data, error } = await supabase
    .from("menuvv_rate_cards")
    .upsert(toSavedCardRow(card, userData.user.id), { onConflict: "id" })
    .select()
    .single();
  return { card: data ? fromSavedCardRow(data) : card, error };
}

async function deleteSavedCard(cardId) {
  const configurationError = requireConfigured();
  if (configurationError) return { error: configurationError };

  const { error } = await supabase
    .from("menuvv_rate_cards")
    .delete()
    .eq("id", cardId);
  return { error };
}

window.menuvvAuth = {
  isConfigured,
  getUser,
  getSession,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  signOut,
  listSavedCards,
  saveSavedCard,
  deleteSavedCard
};

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    window.menuvvAuthSession = session;
    window.handleMenuvvAuthState?.(session);
  });

  window.menuvvAuthReady = supabase.auth.getSession().then(({ data }) => {
    window.menuvvAuthSession = data.session;
    window.handleMenuvvAuthState?.(data.session);
    return data.session;
  });
} else {
  window.menuvvAuthReady = Promise.resolve(null);
}
