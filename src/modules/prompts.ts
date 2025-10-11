// src/modules/prompts.ts
// 统一管理所有 LLM 提示词

export type PromptType =
  | 'ask'
  | 'translate'
  | 'summarize'
  | 'system_multi_turn';

export function getPrompt(type: PromptType, lang: string = 'zh-CN', options?: { [key: string]: any }): string {
  switch (type) {
    case 'ask':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手，根据提供的论文内容，使用中文回答我的问题。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
    case 'translate':
      return lang === 'en-US'
        ? 'You are a professional academic translator. Please translate the following academic text to English. Maintain the original meaning and academic tone. Keep technical terms precise and consistent. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位专业的学术翻译员。请将以下学术文本翻译成中文。保持原文意思和学术语调，确保专业术语准确一致。不使用Markdown格式，保持纯文本输出。';
    case 'summarize':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please read the following paper content and summarize the key points in concise and clear English for quick understanding. Only keep the essential information, avoid lengthy explanations. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手，阅读以下论文内容，并用简洁、清晰的中文总结其核心要点，适合快速理解重点。请仅保留关键信息，避免冗长解释。同时不使用Markdown格式，保持纯文本输出。';
    case 'system_multi_turn':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手，根据提供的论文内容，使用中文回答我的问题。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
    default:
      return '';
  }
}
