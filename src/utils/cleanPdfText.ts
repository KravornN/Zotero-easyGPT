/**
 * 清理PDF提取的原始文本，修复常见格式问题
 * - 合并被连字符断开的单词
 * - 合并错误断开的行
 * - 去除多余空行
 * - 合理合并段落
 */
export function cleanPdfText(text: string): string {
  if (!text) return '';
  let cleaned = text;
  // 1. 合并被连字符断开的单词（如 "exam-\nple" -> "example"）
  cleaned = cleaned.replace(/([a-zA-Z])-\s*\n\s*([a-zA-Z])/g, '$1$2');
  // 2. 合并被错误断开的英文行（行尾不是标点且下一行首字母小写）
  cleaned = cleaned.replace(/([a-zA-Z,;])\n([a-z])/g, '$1 $2');
  // 3. 合并被错误断开的中文行（行尾不是标点且下一行是中文）
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\n([\u4e00-\u9fa5])/g, '$1$2');
  // 4. 多个连续空行只保留一个
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // 5. 行首尾多余空白
  cleaned = cleaned.replace(/^[ \t]+|[ \t]+$/gm, '');
  // 6. 合理合并段落（如一行结尾不是标点，下一行首字母小写，合并为一行）
  cleaned = cleaned.replace(/([a-zA-Z0-9\u4e00-\u9fa5])[ \t]*\n[ \t]*([a-z0-9\u4e00-\u9fa5])/g, '$1 $2');
  // 7. 再次去除多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}