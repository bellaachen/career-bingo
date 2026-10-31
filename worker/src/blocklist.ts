/**
 * Nickname blocklist. Server-only: never imported by the frontend, so it isn't shipped to browsers.
 * Matching ignores case, spaces and punctuation (see checkNickname). Keep entries specific enough
 * not to block ordinary words (e.g. "幹你" rather than "幹", which appears in 能幹 / 幹勁).
 */
export const BLOCKLIST: readonly string[] = [
  // English
  'fuck', 'fck', 'fuk', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'dickhead', 'pussy', 'whore', 'slut',
  'retard', 'nigger', 'nigga', 'faggot', 'motherfucker', 'wtf', 'stfu', 'porn', 'nazi', 'hitler',
  // 中文
  '幹你', '幹妳', '幹林', '幹拎', '靠北', '靠杯', '靠腰', '機掰', '雞掰', '機八', '雞巴', '操你', '肏', '他媽', '他馬',
  '媽的', '你娘', '白痴', '白癡', '智障', '腦殘', '低能', '婊子', '賤人', '王八', '去死', '屁眼', '妓女', '畜生', '色情',
]
