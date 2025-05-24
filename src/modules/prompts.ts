// src/modules/prompts.ts
// 统一管理所有 LLM 提示词

export type PromptType =
  | 'ask'
  | 'ask_associate'
  | 'summarize'
  | 'summarize_associate'
  | 'system_multi_turn';

export function getPrompt(type: PromptType, lang: string = 'zh-CN', options?: { [key: string]: any }): string {
  switch (type) {
    case 'ask':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手，根据提供的论文内容，使用中文回答我的问题。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
    case 'ask_associate':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. The following includes the main paper content and may be supplemented by content from related PubMed articles retrieved through an associative search. Please synthesize all information to provide a comprehensive answer. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手。请根据提供的论文内容使用中文回答我的问题。接下来的内容包括了主要论文信息，并可能补充了检索到的相关PubMed文章。请综合所有信息给出全面的回答。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
    case 'summarize':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please read the following paper content and summarize the key points in concise and clear English for quick understanding. Only keep the essential information, avoid lengthy explanations. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手，阅读以下论文内容，并用简洁、清晰的中文总结其核心要点，适合快速理解重点。请仅保留关键信息，避免冗长解释。同时不使用Markdown格式，保持纯文本输出。';
    case 'summarize_associate':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please read the following paper content and summarize the key points in concise and clear English for quick understanding. The following includes the main paper content and may be supplemented by content from related PubMed articles retrieved through an associative search. Please summarize the main paper and related articles separately. Only keep the essential information, avoid lengthy explanations. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手。请阅读以下论文内容，并用简洁、清晰的中文总结其核心要点，适合快速理解重点。接下来的内容包括了主要论文信息，并可能补充了检索到的相关PubMed文章。请分开总结主要论文和相关文章。请仅保留关键信息，避免冗长解释。同时不使用Markdown格式，保持纯文本输出。';
    case 'system_multi_turn':
      return lang === 'en-US'
        ? 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. Do not use Markdown format, keep the output as plain text.'
        : '请你扮演一位学术助手，根据提供的论文内容，使用中文回答我的问题。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
    default:
      return '';
  }
}
