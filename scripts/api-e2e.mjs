// End-to-end API test. Usage: node scripts/api-e2e.mjs [apiBase] [allowedOrigin]
// Run against a LOCAL worker only (npm run api:dev) — it writes test shares and trips rate limits.
// Black-box API test against the local Worker. Board data comes from the real question bank.
const API = process.argv[2] ?? 'http://localhost:8787'
const O = { Origin: process.argv[3] ?? 'http://localhost:5173', 'Content-Type': 'application/json' }
const pm = Array.from({ length: 30 }, (_, i) => `pm-${String(i + 1).padStart(3, '0')}`)
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1])
const board = () => shuffle(pm).slice(0, 24)
const at = (b, i) => (i === 12 ? null : b[i < 12 ? i : i - 1])
const post = (path, body, headers = O) => fetch(API + path, { method: 'POST', headers, body: JSON.stringify(body) }).then(async (r) => [r.status, await r.json().catch(() => null)])
const get = (path) => fetch(API + path, { headers: O }).then(async (r) => [r.status, await r.json()])
let pass = 0, fail = 0
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(ok ? '✓' : '✗', name, extra) }

const b1 = board(); const row = [0, 1, 2, 3, 4].map((i) => at(b1, i))
let [s, r] = await post('/api/shares', { role: 'pm', lang: 'zh-TW', clientId: 'client-aaaaaaaaaaaaaaaa', nickname: '爆肝的產品經理', board: b1, marked: row, lines: 99 })
check('valid share 201', s === 201, JSON.stringify({ s, pos: r?.position }))
check('server recomputed lines (row=1, not 99)', r?.stats?.avgLines === 1, `avg=${r?.stats?.avgLines}`)
const firstId = r?.id
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'zh-TW', clientId: 'client-aaaaaaaaaaaaaaaa', nickname: '', board: b1, marked: [] })
check('duplicate board 409', s === 409 && r.error === 'duplicate')
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-bbbbbbbbbbbbbbbb', nickname: 'www.spam', board: board(), marked: [] })
check('url nickname rejected', s === 400 && r.error === 'nickname_url')
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-bbbbbbbbbbbbbbbb', nickname: 'F.U.C.K pm', board: board(), marked: [] })
check('profanity nickname rejected', s === 400 && r.error === 'nickname_profanity')
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-bbbbbbbbbbbbbbbb', nickname: '爆肝的產品經理呀', board: board(), marked: [] })
check('8 CJK chars rejected', s === 400 && r.error === 'nickname_too_long')
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-bbbbbbbbbbbbbbbb', nickname: '', board: board().slice(0, 23).concat('qa-001'), marked: [] })
check('cross-role prompt rejected', s === 400 && r.error === 'invalid_board')
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-bbbbbbbbbbbbbbbb', nickname: '', board: board(), marked: ['pm-999'] })
check('marked off-board rejected', s === 400 && r.error === 'invalid_board')
;[s, r] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-cccccccccccccccc', nickname: 'x', board: board(), marked: [] }, { ...O, Origin: 'https://evil.example' })
check('foreign origin 403', s === 403)

// rate limit: client limit is 10/day (1 already used by aaaa)
let last = 0
for (let i = 0; i < 10; i++) [last] = await post('/api/shares', { role: 'pm', lang: 'en', clientId: 'client-aaaaaaaaaaaaaaaa', nickname: '', board: board(), marked: [] })
check('11th share from same client 429', last === 429, `last=${last}`)

;[s, r] = await get('/api/stats?role=pm')
check('stats shares = 10', s === 200 && r.shares === 10, `shares=${r.shares} total=${r.totalShares}`)
const appearedSum = Object.values(r.prompts).reduce((a, p) => a + p.appeared, 0)
check('each share adds 24 appearances', appearedSum === 240, `sum=${appearedSum}`)

;[s, r] = await get('/api/shares?role=pm&limit=30')
check('wall lists 10 cards, newest first', s === 200 && r.cards.length === 10 && r.cards[0].createdAt >= r.cards[9].createdAt)
const mine = r.cards.find((c) => c.id === firstId)
check('card has 25 cells, nickname shown', mine?.cells.length === 25 && mine?.nickname === '爆肝的產品經理' && mine?.lines === 1)

for (const c of ['r1-aaaaaaaaaaaaaaaa', 'r1-aaaaaaaaaaaaaaaa', 'r2-aaaaaaaaaaaaaaaa']) await post(`/api/shares/${firstId}/report`, { clientId: c })
;[s, r] = await get('/api/shares?role=pm')
check('2 distinct reports: nickname still shown', r.cards.find((c) => c.id === firstId).nickname === '爆肝的產品經理')
;[s, r] = await post(`/api/shares/${firstId}/report`, { clientId: 'r3-aaaaaaaaaaaaaaaa' })
check('3rd distinct report hides nickname', r.hidden === true)
;[s, r] = await get('/api/shares?role=pm')
check('hidden nickname returns null, stats unchanged', r.cards.find((c) => c.id === firstId).nickname === null)
;[s] = await post('/api/shares/nope/report', { clientId: 'r3-aaaaaaaaaaaaaaaa' })
check('report unknown id 404', s === 404)
;[s] = await get('/api/stats?role=ceo')
check('bad role 400', s === 400)
console.log(`\n${pass} passed, ${fail} failed`)
