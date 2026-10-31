import type { LocalizedText, RoleId } from '../types'

/**
 * Career Survival Level: derived only from completed lines (0–12).
 * Copy is from PRD v2 §5, with two agreed tweaks (v3 spec):
 *  - ALL L1 en: "How precious." → "Cherish that innocence."
 *  - QA L5 zh: 「RD 說無法重現」 → 「工程師說無法重現」
 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6

export interface SurvivalCopy {
  title: LocalizedText
  description: LocalizedText
}

/** Upper bound (inclusive) of completed lines for levels 1–5; 6 is everything above. */
const LEVEL_MAX_LINES = [0, 2, 4, 7, 10] as const

export function getSurvivalLevel(completedLines: number): Level {
  const i = LEVEL_MAX_LINES.findIndex((max) => completedLines <= max)
  return (i === -1 ? 6 : i + 1) as Level
}

type Row = [zhTitle: string, enTitle: string, zhLine: string, enLine: string]
type Six = [Row, Row, Row, Row, Row, Row]

const CATALOG: Record<Exclude<RoleId, 'rd'>, Six> = {
  pm: [
    ['需求小白', 'Scope Rookie', '你還相信需求確認後就不會再改。', 'You still believe sign-off means the scope is final.'],
    ['會議倖存者', 'Meeting Survivor', '你的日曆比 Roadmap 還滿，結論卻比文件還少。', 'Your calendar is fuller than the roadmap, but decisions are nowhere to be found.'],
    ['需求接球員', 'Scope Catcher', '每個人都把需求丟給你，沒人附上優先級。', 'Everyone throws requirements at you. Nobody includes priorities.'],
    ['優先級馴獸師', 'Priority Tamer', '你已經能在五個 P0 裡排出第一名。', 'You can rank five P0 requests without laughing.'],
    ['需求地獄戰士', 'Scope Warrior', 'Sprint 在燃燒，你還在幫大家確認 Acceptance Criteria。', 'The sprint is on fire, and you are still clarifying acceptance criteria.'],
    ['需求地獄統治者', 'Scope Overlord', '你已經不管理需求了，需求現在歸你管。', 'You no longer manage scope. Scope reports to you.'],
  ],
  fe: [
    ['HTML 學徒', 'HTML Apprentice', '你還相信畫面照設計稿切就會一模一樣。', 'You still believe matching the mockup is straightforward.'],
    ['切版求生者', 'Layout Survivor', '桌機版很完美，手機版決定走自己的路。', 'Desktop looks perfect. Mobile has chosen its own path.'],
    ['跑版修復師', 'Layout Fixer', '你修好一個間距，另外三個地方開始位移。', 'You fix one spacing issue and three more appear.'],
    ['瀏覽器馴獸師', 'Browser Tamer', 'Chrome 說沒問題，Safari 說我們需要談談。', 'Chrome says yes. Safari says we need to talk.'],
    ['CSS 驅魔師', 'CSS Exorcist', '你不是在寫 CSS，你是在跟 specificity 談判。', 'You are not writing CSS. You are negotiating with specificity.'],
    ['像素地獄統治者', 'Pixel Overlord', '你的 CSS 沒有 Bug，只有瀏覽器不夠努力。', 'Your CSS has no bugs. The browsers just need to try harder.'],
  ],
  be: [
    ['API 新兵', 'API Rookie', '你還以為 HTTP 200 就代表一切正常。', 'You still think HTTP 200 means everything is fine.'],
    ['Log 觀察員', 'Log Watcher', '你看 Log 的時間，比看訊息還長。', 'You spend more time reading logs than messages.'],
    ['資料庫救火員', 'Database Firefighter', '一個慢查詢，就讓整個下午變成事故現場。', 'One slow query turns your afternoon into an incident.'],
    ['服務守護者', 'Service Guardian', '大家睡得安穩，是因為你還在看監控。', 'Everyone sleeps peacefully because you are watching the dashboards.'],
    ['Production 守夜人', 'Production Night Watch', '半夜的 Alert 比你的鬧鐘還準時。', 'Midnight alerts are more reliable than your alarm clock.'],
    ['系統不死傳說', 'Uptime Legend', '當 Production 出事，連監控系統都會先向你道歉。', 'When production breaks, even the monitoring system apologizes to you.'],
  ],
  qa: [
    ['Bug 見習生', 'Bug Apprentice', '你還相信「我測過了」是一種證據。', 'You still believe “I tested it” counts as evidence.'],
    ['缺陷偵探', 'Bug Detective', '別人看到功能，你先看到重現步驟。', 'Others see features. You see reproduction steps.'],
    ['回歸測試戰士', 'Regression Warrior', '修好一個 Bug，舊朋友又回來打招呼。', 'Fix one bug and an old friend returns.'],
    ['邊界條件獵人', 'Edge Case Hunter', '你總能找到沒有人想過要輸入的值。', 'You always find the input nobody thought to try.'],
    ['Bug 驅魔師', 'Bug Exorcist', '工程師說無法重現，你已經錄好第三支影片。', 'The developer cannot reproduce it. You have recorded video number three.'],
    ['終極 Bug 獵殺者', 'Ultimate Bug Hunter', '上線前最後一道防線，就是你和你的測試案例。', 'The final line of defense before release is you and your test cases.'],
  ],
  ui: [
    ['像素學徒', 'Pixel Apprentice', '你還相信大家都看得出 8px 和 12px 的差別。', 'You still believe everyone notices the difference between 8px and 12px.'],
    ['Figma 求生者', 'Figma Survivor', '你的畫板數量，已經超過本週睡眠時數。', 'Your frame count has overtaken your hours of sleep.'],
    ['按鈕修復師', 'Button Fixer', '一顆按鈕改了六版，需求仍叫「微調」。', 'A button gets six revisions. The request is still called a tiny tweak.'],
    ['Design System 守護者', 'Design System Guardian', '你建立元件庫，大家卻各自畫自己的按鈕。', 'You built a component library. Everyone still draws their own buttons.'],
    ['視覺地獄戰士', 'Visual Chaos Warrior', '你把畫面統一了，下一封訊息又要「更活潑」。', 'You unified the UI. The next message asks for more pop.'],
    ['像素完美主義魔王', 'Pixel Perfection Overlord', '你看得見一個像素的偏差，也看透無限次修改。', 'You can spot a one-pixel shift and a never-ending revision cycle.'],
  ],
  ux: [
    ['用研新手', 'Research Rookie', '你還相信每個決策都會先問使用者。', 'You still believe every decision starts with user research.'],
    ['訪談倖存者', 'Interview Survivor', '訪談問完十個人，主管說他朋友不是這樣用。', 'You interviewed ten users. A manager cites one friend.'],
    ['流程迷宮探索者', 'Flow Explorer', '一個簡單任務，畫出了三十個分支。', 'One simple task turned into thirty branches.'],
    ['使用者代言人', 'User Advocate', '會議上只有你還記得使用者要完成什麼。', 'You are the only one in the meeting remembering the user goal.'],
    ['認知偏誤驅魔師', 'Bias Exorcist', '你用研究報告，對抗「我覺得比較好」。', 'You bring research to a battle against “I just feel this is better.”'],
    ['體驗迷宮統治者', 'UX Maze Master', '你能走出最複雜的流程，卻走不出無止境的意見。', 'You can untangle any user flow, but not endless stakeholder opinions.'],
  ],
  marketing: [
    ['流量新兵', 'Traffic Rookie', '你還相信好內容自然會有流量。', 'You still believe great content automatically gets reach.'],
    ['素材求生者', 'Creative Survivor', '活動明天上線，主視覺今晚才定稿。', 'The campaign launches tomorrow. The key visual gets approved tonight.'],
    ['轉換率追逐者', 'Conversion Chaser', '點擊率漲了，老闆問為什麼營收沒跟著漲。', 'CTR went up. The boss asks why revenue did not.'],
    ['演算法馴獸師', 'Algorithm Tamer', '你每天都在猜演算法今天喜歡什麼。', 'Every day you guess what the algorithm likes now.'],
    ['KPI 地獄戰士', 'KPI Warrior', '預算砍半，目標翻倍，簡報還要更漂亮。', 'Half the budget, double the target, and prettier slides please.'],
    ['流量召喚大魔王', 'Traffic Overlord', '你連做夢都在 A/B Test 標題和 CTA。', 'You A/B test headlines and CTAs even in your dreams.'],
  ],
  am: [
    ['客戶新兵', 'Client Rookie', '你還相信「最後一個修改」真的是最後一個。', 'You still believe “one last change” means one last change.'],
    ['已讀不回倖存者', 'Ghosting Survivor', '客戶三天沒回覆，卻在截止前五分鐘上線。', 'The client goes silent for three days, then replies five minutes before deadline.'],
    ['需求翻譯師', 'Client Whisperer', '你把「感覺怪怪的」翻譯成可執行需求。', 'You translate “something feels off” into actionable requirements.'],
    ['客戶情緒馴獸師', 'Client Tamer', '你能一邊微笑，一邊把緊急需求排進下週。', 'You can smile while scheduling an urgent request for next week.'],
    ['客訴地獄戰士', 'Escalation Warrior', '你處理的不只是問題，還有每個人的情緒。', 'You manage more than issues. You manage everyone’s emotions.'],
    ['客戶關係不死傳說', 'Client Relations Legend', '你已經能從「方便聊一下嗎」預測整個下午。', 'You can predict the entire afternoon from “Got a minute?”'],
  ],
  all: [
    ['職場萌新', 'Corporate Newbie', '你還相信會議都會有結論。珍惜這份純真。', 'You still believe meetings lead to decisions. Cherish that innocence.'],
    ['咖啡續命者', 'Coffee Survivor', '咖啡不是飲料，是讓你回覆訊息的燃料。', 'Coffee is not a beverage. It powers your replies.'],
    ['會議受害者', 'Meeting Victim', '今天最大的成就，是準時結束一場會議。', 'Your biggest win today was ending one meeting on time.'],
    ['Deadline 馴獸師', 'Deadline Tamer', '每個截止日都很緊急，直到它被延後。', 'Every deadline is urgent until it gets postponed.'],
    ['職場地獄生還者', 'Workplace Warrior', 'Bug、Deadline 和臨時需求，已經變成你的背景音。', 'Bugs, deadlines, and surprise requests are now background noise.'],
    ['傳說級打工人', 'Corporate Legend', '你不是在科技業工作，你就是科技業的活歷史。', 'You do not just work in tech. You are its living history.'],
  ],
}

/** Survival copy for a role and level. Retired roles (RD) borrow the Everyone-in-Tech copy. */
export function getSurvivalCopy(role: RoleId, level: Level): SurvivalCopy {
  const [zhTitle, enTitle, zhLine, enLine] = CATALOG[role === 'rd' ? 'all' : role][level - 1]
  return { title: { 'zh-TW': zhTitle, en: enTitle }, description: { 'zh-TW': zhLine, en: enLine } }
}

export const SURVIVAL_ROLES = Object.keys(CATALOG) as Exclude<RoleId, 'rd'>[]
