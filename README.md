# Zotero-easyGPT

<div align="center">
  <img src="logo.png" width="77%" />
</div>

A Zotero plugin that integrates GPT functionalities into the PDF reader sidebar. Ask questions about or summarize PDF content directly within Zotero. 

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![License](https://img.shields.io/github/license/KravornN/Zotero-easyGPT?style=flat-square)](https://github.com/KravornN/Zotero-easyGPT/blob/main/LICENSE)
[![Latest release](https://img.shields.io/github/v/release/KravornN/Zotero-easyGPT?style=flat-square&color=blue)](https://github.com/KravornN/Zotero-easyGPT/releases)
[![GitHub Downloads](https://img.shields.io/github/downloads/KravornN/Zotero-easyGPT/total?label=Downloads&style=flat-square)](https://github.com/KravornN/Zotero-easyGPT/releases)


## Main Features

- [x] 🌐 **PubMed Search**: Search PubMed via Google PSE for related articles.
- [x] 📄 **PDF Sidebar Integration**: Seamlessly appears in the Zotero PDF reader sidebar for quick access.
- [x] 🔍 **Text Selection & Full Text Support**: Insert selected text or the entire PDF content into the AI query area with one click.
- [x] 💬 **Ask AI Anything**: Directly ask GPT questions about the PDF content and get instant answers.
- [x] 📝 **One-Click Summarization**: Summarize the PDF content with a single click.
- [x] 🌐 **Language Switch**: Easily switch between Chinese and English for prompts and AI responses via the plugin settings.
- [x] 🔌 **OpenAI-Compatible**: Works with any API compatible with the OpenAI specification.
- [x] 🎨 **User-Friendly UI**: Clean, intuitive interface with copyable AI output.
- [x] ⚙️ **Customizable Model & Endpoint**: Configure API base URL, model, and key to fit your needs.


## Usage
- Get `.xpi` file: [download latest](https://github.com/KravornN/Zotero-easyGPT/releases/latest/download/zotero-easy-gpt.xpi) release `.xpi` file
- Install `.xpi` file in Zotero
- Open Zotero-easyGPT setting

### 中国用户
可以使用硅基流动，例如：

* **Base URL:** 填入 `https://api.siliconflow.cn`
* **Model:** 选择 `deepseek-ai/DeepSeek-V3` (或其他)
* **API Key:** 填入你的硅基流动 API Key
* 配置完成后即可使用。

**也可以使用其他兼容OpenAI的API服务**

### International Users

You can use OpenAI or other services compatible with the OpenAI API specification.

**Using OpenAI:**

* **API URL:** Enter `https://api.openai.com`
* **Model:** Choose the OpenAI model you wish to use. Ensure your API key has permissions for the selected model.
* **API Key:** Enter your OpenAI API Key.
* Once configured, it's ready to use.

**Using other compatible services (e.g., Azure etc.)**


## Reference
[zotero-chatgpt](https://github.com/kazgu/zotero-chatgpt)
