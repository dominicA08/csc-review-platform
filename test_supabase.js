// Simple test using built-in fetch (Node 18+), no extra dependencies needed
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf8')
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim()
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim()

const headers = {
  'apikey': supabaseAnonKey,
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
}

async function test() {
  // Test 1: Fetch all user_progress rows (no auth, checks RLS)
  console.log('\n=== Test 1: user_progress table (anon read) ===')
  const r1 = await fetch(`${supabaseUrl}/rest/v1/user_progress?select=*`, { headers })
  const d1 = await r1.json()
  console.log('Status:', r1.status)
  console.log('Data:', JSON.stringify(d1, null, 2))

  // Test 2: Fetch all exam_sessions rows (no auth, checks RLS)
  console.log('\n=== Test 2: exam_sessions table (anon read) ===')
  const r2 = await fetch(`${supabaseUrl}/rest/v1/exam_sessions?select=*`, { headers })
  const d2 = await r2.json()
  console.log('Status:', r2.status)
  console.log('Data:', JSON.stringify(d2, null, 2))

  // Test 3: Fetch questions (check access)
  console.log('\n=== Test 3: questions table (anon read) ===')
  const r3 = await fetch(`${supabaseUrl}/rest/v1/questions?select=id,category&limit=3`, { headers })
  const d3 = await r3.json()
  console.log('Status:', r3.status)
  console.log('Data:', JSON.stringify(d3, null, 2))
}

test().catch(console.error)
