import { completedLines, markedCells } from '../../src/lib/bingo'
import { isRoleId } from '../../src/data/roles'
import {
  DAILY_LIMIT_PER_CLIENT, DAILY_LIMIT_PER_IP, REPORTS_TO_HIDE, WALL_SIZE, validateShare,
  type ApiErrorCode, type RoleStats, type ShareCard,
} from '../../src/lib/share'
import type { RoleId } from '../../src/types'
import { BLOCKLIST } from './blocklist'

export interface Env {
  DB: D1Database
  ALLOWED_ORIGINS: string
  ALLOW_LOCALHOST: string
  IP_SALT?: string
}

const MAX_BODY = 8 * 1024

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env)

    if (request.method === 'OPTIONS') return new Response(null, { status: cors ? 204 : 403, headers: cors ?? {} })
    // Browsers from other sites are refused outright; CORS is not our abuse defense (rate limits are).
    if (origin && !cors) return json({ error: 'forbidden' }, 403)

    try {
      const url = new URL(request.url)
      const path = url.pathname.replace(/\/+$/, '')
      let res: Response
      if (path === '/api/health') res = json({ ok: true })
      else if (path === '/api/shares' && request.method === 'POST') res = await createShare(request, env)
      else if (path === '/api/shares' && request.method === 'GET') res = await listShares(url, env)
      else if (path === '/api/stats' && request.method === 'GET') res = await getStatsRoute(url, env)
      else if (/^\/api\/shares\/[\w-]+\/report$/.test(path) && request.method === 'POST') res = await reportShare(path.split('/')[3], request, env)
      else res = error('not_found', 404)
      return withHeaders(res, cors)
    } catch (err) {
      // D1 free-tier daily limits and transient errors both surface as "busy".
      console.error(err)
      return withHeaders(error('busy', 503), cors)
    }
  },
} satisfies ExportedHandler<Env>

// ---------- routes ----------

async function createShare(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request)
  const result = validateShare(body, BLOCKLIST)
  if (!result.ok) return error(result.code, 400)
  const s = result.share

  const now = Date.now()
  const dayStart = now - (now % 86_400_000)
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const [clientHash, ipHash, boardHash] = await Promise.all([
    sha256(`client:${s.clientId}`),
    sha256(`ip:${ip}:${new Date(dayStart).toISOString().slice(0, 10)}:${env.IP_SALT ?? ''}`),
    sha256(`board:${s.role}:${s.board.join(',')}`),
  ])

  const [byClient, byIp, dup] = await env.DB.batch<{ n: number }>([
    env.DB.prepare('SELECT COUNT(*) AS n FROM shares WHERE client_hash = ? AND created_at >= ?').bind(clientHash, dayStart),
    env.DB.prepare('SELECT COUNT(*) AS n FROM shares WHERE ip_hash = ? AND created_at >= ?').bind(ipHash, dayStart),
    env.DB.prepare('SELECT COUNT(*) AS n FROM shares WHERE client_hash = ? AND board_hash = ?').bind(clientHash, boardHash),
  ])
  if ((dup.results[0]?.n ?? 0) > 0) return error('duplicate', 409)
  if ((byClient.results[0]?.n ?? 0) >= DAILY_LIMIT_PER_CLIENT || (byIp.results[0]?.n ?? 0) >= DAILY_LIMIT_PER_IP) {
    return error('rate_limited', 429)
  }

  const id = crypto.randomUUID()
  const markedSet = new Set(s.marked)
  // One atomic batch: if the insert fails (e.g. a racing duplicate), aggregates are not touched.
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO shares (id, role, board, marked, lines, marked_count, nickname, lang, client_hash, ip_hash, board_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, s.role, JSON.stringify(s.board), JSON.stringify(s.marked), s.lines, s.markedCount, s.nickname, s.lang, clientHash, ipHash, boardHash, now),
      env.DB.prepare(
        `INSERT INTO role_stats (role, shares, lines_sum) VALUES (?, 1, ?)
         ON CONFLICT (role) DO UPDATE SET shares = shares + 1, lines_sum = lines_sum + excluded.lines_sum`,
      ).bind(s.role, s.lines),
      ...s.board.map((pid) =>
        env.DB.prepare(
          `INSERT INTO prompt_stats (role, prompt_id, appeared, hits) VALUES (?, ?, 1, ?)
           ON CONFLICT (role, prompt_id) DO UPDATE SET appeared = appeared + 1, hits = hits + excluded.hits`,
        ).bind(s.role, pid, markedSet.has(pid) ? 1 : 0),
      ),
    ])
  } catch (err) {
    if (String(err).includes('UNIQUE')) return error('duplicate', 409)
    throw err
  }

  const stats = await readStats(env, s.role)
  return json({ id, position: stats.shares, stats }, 201)
}

async function getStatsRoute(url: URL, env: Env): Promise<Response> {
  const role = url.searchParams.get('role')
  if (!isRoleId(role)) return error('invalid_request', 400)
  return json(await readStats(env, role), 200, { 'Cache-Control': 'public, max-age=60' })
}

async function listShares(url: URL, env: Env): Promise<Response> {
  const role = url.searchParams.get('role')
  if (!isRoleId(role)) return error('invalid_request', 400)
  const limit = Math.min(WALL_SIZE, Math.max(1, Number(url.searchParams.get('limit')) || WALL_SIZE))
  const { results } = await env.DB.prepare(
    `SELECT id, board, marked, lines, marked_count, nickname, nickname_hidden, created_at
     FROM shares WHERE role = ? ORDER BY created_at DESC LIMIT ?`,
  ).bind(role, limit).all<{ id: string; board: string; marked: string; lines: number; marked_count: number; nickname: string; nickname_hidden: number; created_at: number }>()

  const cards: ShareCard[] = results.map((r) => {
    const cells = markedCells(JSON.parse(r.board) as string[], JSON.parse(r.marked) as string[])
    return {
      id: r.id,
      nickname: r.nickname_hidden || !r.nickname ? null : r.nickname,
      lines: completedLines(cells).length,
      markedCount: r.marked_count,
      cells,
      createdAt: r.created_at,
    }
  })
  return json({ role, cards }, 200, { 'Cache-Control': 'public, max-age=30' })
}

async function reportShare(id: string, request: Request, env: Env): Promise<Response> {
  const body = (await readJson(request)) as { clientId?: unknown } | null
  if (!body || typeof body.clientId !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.clientId)) return error('invalid_request', 400)
  const exists = await env.DB.prepare('SELECT 1 AS x FROM shares WHERE id = ?').bind(id).first()
  if (!exists) return error('not_found', 404)

  const clientHash = await sha256(`client:${body.clientId}`)
  const [, count] = await env.DB.batch<{ n: number }>([
    env.DB.prepare('INSERT OR IGNORE INTO reports (share_id, client_hash, created_at) VALUES (?, ?, ?)').bind(id, clientHash, Date.now()),
    env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE share_id = ?').bind(id),
  ])
  const hidden = (count.results[0]?.n ?? 0) >= REPORTS_TO_HIDE
  if (hidden) await env.DB.prepare('UPDATE shares SET nickname_hidden = 1 WHERE id = ?').bind(id).run()
  return json({ ok: true, hidden })
}

// ---------- helpers ----------

async function readStats(env: Env, role: RoleId): Promise<RoleStats> {
  const [roleRow, prompts, total] = await env.DB.batch<Record<string, number | string>>([
    env.DB.prepare('SELECT shares, lines_sum FROM role_stats WHERE role = ?').bind(role),
    env.DB.prepare('SELECT prompt_id, appeared, hits FROM prompt_stats WHERE role = ?').bind(role),
    env.DB.prepare('SELECT COALESCE(SUM(shares), 0) AS n FROM role_stats'),
  ])
  const r = roleRow.results[0] as { shares: number; lines_sum: number } | undefined
  const shares = r?.shares ?? 0
  return {
    role,
    shares,
    avgLines: shares ? Math.round((r!.lines_sum / shares) * 10) / 10 : 0,
    totalShares: Number(total.results[0]?.n ?? 0),
    prompts: Object.fromEntries(
      (prompts.results as { prompt_id: string; appeared: number; hits: number }[]).map((p) => [p.prompt_id, { appeared: p.appeared, hits: p.hits }]),
    ),
  }
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> | null {
  if (!origin) return null
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  const local = env.ALLOW_LOCALHOST === '1' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  if (!allowed.includes(origin) && !local) return null
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text()
  if (text.length > MAX_BODY) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra } })
}

function error(code: ApiErrorCode | 'forbidden', status: number): Response {
  return json({ error: code }, status)
}

function withHeaders(res: Response, extra: Record<string, string> | null): Response {
  if (!extra) return res
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(extra)) headers.set(k, v)
  return new Response(res.body, { status: res.status, headers })
}
