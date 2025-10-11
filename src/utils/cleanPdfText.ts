/**
 * 清理PDF提取的英文原始文本，修复常见格式问题
 * - 多轮合并被连字符断开的单词
 * - 仅合并“非标点结尾且下一行首字母小写/数字”的断行
 * - 不合并表格/公式区域（大部分为符号或数字的行）
 * - 去除多余空行和多余空格
 * - 保留正常换行和段落结构
 */
export function cleanPdfText(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. 多轮合并被连字符断开的单词（如 "exam-\nple" -> "example"），直到无变化
  let prev;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/([a-zA-Z])-(\s*\n\s*)([a-zA-Z])/g, '$1$3');
  } while (cleaned !== prev);

  // 2. 按行处理，智能合并断行，但保留表格/公式区域
  const lines = cleaned.split(/\r?\n/);
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // 判断当前行是否为表格/公式区域（80%以上为非字母）
    const nonWord = line.replace(/[a-zA-Z]/g, '').length;
    if (line.length > 0 && nonWord / line.length > 0.7) {
      merged.push(line); // 直接保留
      continue;
    }
    // 合并：当前行不是以标点结尾，下一行首字母小写/数字，且下一行不是表格/公式
    if (
      i < lines.length - 1 &&
      !/[.!?;:]\s*$/.test(line) &&
      /^[a-z0-9]/.test(lines[i + 1]) &&
      !(lines[i + 1].length > 0 && lines[i + 1].replace(/[a-zA-Z]/g, '').length / lines[i + 1].length > 0.8)
    ) {
      merged.push(line + ' ' + lines[i + 1]);
      i++; // 跳过下一行
    } else {
      merged.push(line);
    }
  }
  cleaned = merged.join('\n');

  // 3. 去除行首缩进空格
  cleaned = cleaned.replace(/^[ \t]+/gm, '');
  // 4. 多个连续空行只保留一个
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // 5. 合并多余空格
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  // 6. 行尾多余空白
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  // 7. 再次去除多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}