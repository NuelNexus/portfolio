import { supabase } from './supabase.js'
import { achievements as defaults } from './achievements.js'

const STORAGE_KEY = 'nuelnexus-achievements'

function toRow(item, index) {
  return {
    id: item.id || crypto.randomUUID(),
    number: item.number,
    title: item.title,
    description: item.description,
    meta: item.meta,
    image: item.image,
    sort_order: index,
  }
}

function fromRow(row) {
  return {
    id: row.id,
    number: row.number,
    title: row.title || ['', ''],
    description: row.description || '',
    meta: row.meta || [],
    image: row.image || null,
  }
}

export function loadLocalAchievements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {}
  return defaults
}

export function saveLocalAchievements(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

export async function fetchAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error || !data) return null
  return data.map(fromRow)
}

export async function saveAchievements(list) {
  const rows = list.map(toRow)
  const { error: upsertError } = await supabase
    .from('achievements')
    .upsert(rows)
  if (upsertError) return false

  const { data: existing, error: fetchError } = await supabase
    .from('achievements')
    .select('id')
  if (fetchError) return true

  const keep = new Set(rows.map((row) => row.id))
  const toDelete = (existing || [])
    .map((row) => row.id)
    .filter((id) => !keep.has(id))
  if (!toDelete.length) return true

  const { error: deleteError } = await supabase
    .from('achievements')
    .delete()
    .in('id', toDelete)
  return !deleteError
}
