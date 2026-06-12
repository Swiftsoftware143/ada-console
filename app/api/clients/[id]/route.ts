import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCache, setCache, cacheKeys } from '@/lib/redis'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cacheKey = cacheKeys.client(params.id)
  
  const cached = await getCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await setCache(cacheKey, data, 3600)

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const updates = await request.json()

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { deleteCache } = await import('@/lib/redis')
  await deleteCache(cacheKeys.client(params.id))

  return NextResponse.json(data)
}
