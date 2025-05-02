/**
 * 清理PDF提取的原始文本，修复常见格式问题
 * - 多轮合并被连字符断开的单词
 * - 智能合并错误断开的行（仅非标点结尾才合并）
 * - 去除多余空行和多余空格
 * - 合理合并段落，保留段落空行
 * - 处理表格/公式区域异常断行
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

  // 2. 合并被错误断开的英文行（行尾不是标点且下一行首字母小写/数字/英文）
  cleaned = cleaned.replace(/([a-zA-Z0-9,;])\n([a-z0-9])/g, '$1 $2');

  // 3. 合并被错误断开的中文行（行尾不是标点且下一行是中文）
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\n([\u4e00-\u9fa5])/g, '$1$2');

  // 4. 智能合并：只有在行尾是标点（中英文 .?!:;，。！？）时才保留换行，否则合并
  cleaned = cleaned.replace(/([^。！？.!?;:，；])\n(?=\S)/g, '$1 ');

  // 5. 去除行首缩进空格，但保留段落空行
  cleaned = cleaned.replace(/^[ \t]+/gm, '');

  // 6. 多个连续空行只保留一个
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 7. 合并多余空格
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // 8. 行尾多余空白
  cleaned = cleaned.replace(/[ \t]+$/gm, '');

  // 9. 处理表格/公式区域：如果一行大部分是符号或数字，保留换行
  // （简单实现：如果一行80%以上为非字母/汉字，则保留换行，否则合并）
  cleaned = cleaned.split('\n').map(line => {
    const nonWord = line.replace(/[a-zA-Z\u4e00-\u9fa5]/g, '').length;
    if (line.length > 0 && nonWord / line.length > 0.8) return line + '\n';
    return line;
  }).join('\n');

  // 10. 再次去除多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}