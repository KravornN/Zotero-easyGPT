import { config } from "../../package.json";
import { getLocaleID, getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { cleanPdfText } from "../utils/cleanPdfText";
import { getPrompt } from "./prompts";

// 创建全局映射来存储每个PDF文档的数据
// 这样可以确保不同文档间的数据不会混淆
const documentResponses = new Map<string, string>();
const documentHistories = new Map<string, any[]>();
const documentMultiTurnStates = new Map<string, boolean>(); // 追踪每个文档的多轮对话状态

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id: pluginID }) => {
        this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/openai.png`,
    });
  }
}

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    // Register an event key for Alt+L
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log(ev, keyOptions.keyboard);
      if (keyOptions.keyboard?.equals("shift,l")) {
        addon.hooks.onShortcuts("larger");
      }
      if (ev.shiftKey && ev.key === "S") {
        addon.hooks.onShortcuts("smaller");
      }
    });

    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Example Shortcuts: Alt+L/S/C",
        type: "success",
      })
      .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutSmallerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Smaller!",
        type: "default",
      })
      .show();
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet(win: Window) {
    const doc = win.document;
    const styles = ztoolkit.UI.createElement(doc, "link", {
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/zoteroPane.css`,
      },
    });
    doc.documentElement.appendChild(styles);
    // doc.getElementById("zotero-item-pane-content")?.classList.add("makeItRed");
  }

  @example
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/openai@0.5x.png`;

    // item menuitem with icon for multi-turn dialog
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-easygpt-multiturn",
      label: "Chat with AI",
      commandListener: async (ev) => {
        const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
        const lang = getPref('lang') as string || 'zh-CN';
        
        // Check if items are selected
        if (!items || items.length === 0) {
          new ztoolkit.ProgressWindow(config.addonName)
            .createLine({
              text: "Please select at least one item.",
              type: "default",
              progress: 100,
            })
            .show(3000);
          return;
        }
        
        // Limit to 10 items
        if (items.length > 10) {
          new ztoolkit.ProgressWindow(config.addonName)
            .createLine({
              text: "Maximum 10 items can be selected. Only the first 10 will be used.",
              type: "default",
              progress: 100,
            })
            .show(3000);
        }
        
        const selectedItems = items.slice(0, 10);
        await openMultiItemsDialog(selectedItems, lang);
      },
      icon: menuIcon,
    });
  }

  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ztoolkit.Menu.register("menuFile", {
      tag: "menuitem",
      label: getString("menuitem-filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  @example
  static async registerExtraColumn() {
    const field = "test1";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "text column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      iconPath: "chrome://zotero/skin/cross.png",
    });
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    const field = "test2";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "custom column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      renderCell(index, data, column) {
        ztoolkit.log("Custom column cell is rendered!");
        const span = Zotero.getMainWindow().document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "span",
        );
        span.className = `cell ${column.className}`;
        span.style.background = "#0dd068";
        span.innerText = "⭐" + data;
        return span;
      },
    });
  }

  @example
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "example",
      pluginID: config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example1-head-text"),
        icon: `chrome://${config.addonRef}/content/icons/openai@0.5x.png`,
      },
      bodyXHTML: `<html:div style="display: flex; flex-direction: column; padding: 4px; font-family: inherit; max-width: 100%; box-sizing: border-box; height: 100%; font-size: 12px; color: var(--color-text-primary);">
        <html:div style="display: flex; flex-direction: row; gap: 4px; margin-bottom: 8px; width: 100%;">
          <html:button id="add_selection_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary); font-family: inherit;">
            <html:span style="font-family: inherit;">Add Selection</html:span>
          </html:button>
          <html:button id="add_fulltext_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary); font-family: inherit;">
            <html:span style="font-family: inherit;">Add Full Text</html:span>
          </html:button>
          <html:button id="clear_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary); font-family: inherit;">
            <html:span style="font-family: inherit;">Clear</html:span>
          </html:button>
        </html:div>
        <html:textarea id="pdftext" style="width: 100%; box-sizing: border-box; min-height: 80px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="PDF Content Area (Insert full or selected text)"></html:textarea>
        <html:textarea id="userquery" style="width: 100%; box-sizing: border-box; min-height: 48px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="Please enter your question..."></html:textarea>
        <html:div style="display: flex; margin-bottom: 8px; width: 100%; gap: 4px;">
          <html:button id="multiturn_btn" title="多轮对话" style="width: 36px; padding: 4px 0; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit;">
            <html:span style="display: flex; align-items: center; justify-content: center; font-family: inherit;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4C3.89543 4 3 4.89543 3 6V17C3 17.5523 3.44772 18 4 18H6V21L10 18H19C20.1046 18 21 17.1046 21 16V6C21 4.89543 20.1046 4 19 4H5ZM5 6H19V16H9.58579L7 17.9142V16H5V6Z" fill="currentColor"/>
              </svg>
            </html:span>
          </html:button>
          <html:button id="uquery_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary); font-family: inherit;">
            <html:span style="font-family: inherit;">Ask AI</html:span>
          </html:button>
          <html:button id="translate_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary); font-family: inherit;">
            <html:span style="font-family: inherit;">Translate</html:span>
          </html:button>
          <html:button id="summarize_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary); font-family: inherit;">
            <html:span style="font-family: inherit;">Summarize</html:span>
          </html:button>
        </html:div>
        <html:textarea id="result" style="width: 100%; box-sizing: border-box; flex-grow: 2; min-height: 120px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary); word-wrap: break-word;" placeholder="AI response will appear here..."></html:textarea>
      </html:div>`,
      sidenav: {
        l10nID: getLocaleID("item-section-example1-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/openai@0.5x.png`,
      },
      onRender: ({ body, item, editable, tabType }) => {

      },
      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        const lang = getPref('lang') as string || 'zh-CN';
        
        // 获取当前文档ID
        const currentItemId = String(item?.id || "unknown");
        
        // 清理其他文档的对话历史（模拟文档切换时的清理）
        const allItemIds = Array.from(documentHistories.keys());
        for (const oldItemId of allItemIds) {
          if (oldItemId !== currentItemId) {
            documentHistories.delete(oldItemId);
            documentResponses.delete(oldItemId);
            documentMultiTurnStates.delete(oldItemId);
          }
        }
        
        const pdftext = body.querySelector("#pdftext") as HTMLTextAreaElement;
        const userquery = body.querySelector("#userquery") as HTMLTextAreaElement;
        const result_p = body.querySelector("#result") as HTMLTextAreaElement;
        const uquery_btn = body.querySelector("#uquery_btn") as HTMLElement;
        const translate_btn = body.querySelector("#translate_btn") as HTMLElement;
        const summarize_btn = body.querySelector("#summarize_btn") as HTMLElement;
        const clear_btn = body.querySelector("#clear_btn") as HTMLElement;
        const add_selection_btn = body.querySelector("#add_selection_btn") as HTMLElement;
        const add_fulltext_btn = body.querySelector("#add_fulltext_btn") as HTMLElement;
        const multiturn_btn = body.querySelector("#multiturn_btn") as HTMLElement;

        if (multiturn_btn) {
            multiturn_btn.setAttribute('title', getString('multiturn-button-tooltip'));
        }
        if (translate_btn) {
            translate_btn.setAttribute('title', getString('translate-button-tooltip'));
        }
        
        // 获取当前文献ID作为唯一标识
        const itemId = String(item?.id || "unknown");
        
        // 为当前文献创建或获取对话历史
        if (!documentHistories.has(itemId)) {
            documentHistories.set(itemId, []);
        }
        let multiTurnHistory = documentHistories.get(itemId)!;
        
        // 获取当前响应（如果有）
        let currentResponse = documentResponses.get(itemId) || '';
        
        // 移除多轮对话状态，侧边栏只支持单独对话
        let multiTurnActive = false;
        if (multiturn_btn) {
          multiturn_btn.addEventListener("click", async () => {
            // 打开多轮对话弹窗
            await openMultiTurnDialog(itemId, pdftext.value, currentResponse, lang);
          });
        }

        // 设置AI输出框为只读
        if (result_p) {
          result_p.readOnly = true;
        }

        // Add hover effects to buttons
        const buttons = body.querySelectorAll("button");
        buttons.forEach(button => {
          button.addEventListener("mouseover", () => {
            if (button === multiturn_btn && multiTurnActive) return;
            if (window.document.documentElement.getAttribute('theme') === 'dark') {
              button.style.backgroundColor = "var(--color-state-hover-dark)";
            } else {
              button.style.backgroundColor = "var(--color-state-hover)";
            }
          });
          button.addEventListener("mouseout", () => {
            if (button === multiturn_btn && multiTurnActive) return;
            button.style.backgroundColor = "var(--color-background-secondary)";
          });
        });

        function clear_content() {
          pdftext.value = '';
        }

        let lastSelectedText = '';
        let textSelectionListenerRegistered = false;

        function registerTextSelectionListener() {
          if (textSelectionListenerRegistered) {
            return;
          }

          try {
            Zotero.Reader.registerEventListener('renderTextSelectionPopup', (event: any) => {
              if (event.params && event.params.annotation && event.params.annotation.text) {
                lastSelectedText = event.params.annotation.text.trim();
                ztoolkit.log("Selected text captured:", lastSelectedText);
              }
            });

            textSelectionListenerRegistered = true;
            ztoolkit.log("Text selection listener registered successfully");
          } catch (err) {
            ztoolkit.log("Error registering text selection listener:", err);
          }
        }

        registerTextSelectionListener();

        async function add_selection() {
          try {
            result_p.textContent = 'Getting selection...';

            if (lastSelectedText) {
              pdftext.value += lastSelectedText + '\n\n';
              result_p.textContent = 'Selected text added successfully!';
              return;
            }

            const currentTabID = Zotero.Reader.getTabIDFromElement(window.document.activeElement);
            if (!currentTabID) {
              result_p.textContent = 'No active PDF reader found. Please open a PDF and select some text.';
              return;
            }

            const reader = Zotero.Reader.getByTabID(currentTabID);
            if (!reader) {
              result_p.textContent = 'Cannot access the current PDF reader.';
              return;
            }

            try {
              if (reader._iframe && reader._iframe.contentWindow) {
                const win = reader._iframe.contentWindow;
                const selection = win.getSelection();
                if (selection && selection.toString().trim()) {
                  const selectedText = selection.toString().trim();
                  pdftext.value += selectedText + '\n\n';
                  result_p.textContent = 'Selected text added successfully!';
                  return;
                }
              }
            } catch (e) {
              ztoolkit.log("Failed to get selection:", e);
            }

            result_p.textContent = 'Could not retrieve selected text. Please select text in PDF first, then click "Add Selection" button.';
          } catch (error) {
            ztoolkit.log("Error in add_selection:", error);
            result_p.textContent = 'Error getting selected text. Please try copying and pasting manually.';
          }
        }

        async function add_fulltext() {
          try {
            result_p.textContent = 'Extracting full text from PDF...';

            const attachments = await item.getAttachments();
            let pdfText = null;

            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === 'application/pdf') {
                pdfText = await attachment.attachmentText;
                break;
              }
            }

            if (pdfText) {
              const cleanedText = cleanPdfText(pdfText);
              pdftext.value += cleanedText + '\n\n';
              result_p.textContent = 'Full text added successfully.';
            } else {
              result_p.textContent = 'Could not extract text from PDF. The PDF may not be text-based or may be encrypted.';
            }
          } catch (error) {
            ztoolkit.log("Error getting full text:", error);
            result_p.textContent = 'Error: Could not extract text from PDF. Please check if the PDF is accessible.';
          }
        }

        clear_btn.addEventListener('click', clear_content);
        add_selection_btn.addEventListener('click', add_selection);
        add_fulltext_btn.addEventListener('click', add_fulltext);



        async function ask_question() {
          const btnSpan = uquery_btn.querySelector("span");
          if (btnSpan) {
            btnSpan.textContent = "Processing...";
          }
          uquery_btn.style.backgroundColor = "var(--color-state-active)";
          result_p.textContent = '';

          const OPENAI_API_KEY = getPref('input') as string;
          const apiUrl = getPref('base') as string;
          const model = getPref('model') as string;

          var user_qtxt = pdftext.value + '\n' + userquery.value;

          let system_prompt = getPrompt('ask', lang);

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!model || model.trim() === '') {
            result_p.textContent = 'Model is not set. Please enter the model name in settings.';
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!pdftext.value.trim()) {
            result_p.textContent = 'PDF content cannot be empty. Please insert or enter PDF content first.';
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!userquery.value.trim()) {
            result_p.textContent = 'Please enter your question.';
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }          let messages;          // 侧边栏只支持单轮对话模式
          messages = [
            { role: 'system', content: system_prompt },
            { role: 'user', content: user_qtxt }
          ];

          var requestData = {
            model: model,
            messages: messages,
            stream: true,
          };

          try {
            var response = await fetch(`${apiUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });

            if (!response.ok) {
              throw new Error(`Error: ${response.status} ${response.statusText}`);
            } else {
              result_p.textContent = '';

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let done = false;
              let answer = '';

              while (!done) {
                const { done: streamDone, value } = await reader!.read();
                done = streamDone;
                if (value) {
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n').filter(line => line.trim() !== '');

                  for (var line of lines) {
                    try {
                      line = line.replace('data:', '')
                      const data = JSON.parse(line);                      if (data.choices && data.choices[0]) {
                        const text = data.choices[0].delta?.content || '';
                        answer += text;
                        result_p.textContent = answer;
                      }
                    } catch (error) {
                      ztoolkit.log("Could not parse JSON:", line);
                    }
                  }
                }
              }
                // 存储当前响应到文档特定的映射中
              currentResponse = answer;
              documentResponses.set(itemId, answer);
              
              // 单轮对话完成，保存当前响应供弹窗使用
              // 不需要处理多轮历史
            }
          } catch (error) {
            ztoolkit.log("Error", error);
            result_p.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          } finally {
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
            if (multiTurnActive) {
              userquery.value = '';
            }
          }
        }

        async function summarize_text() {
          const btnSpan = summarize_btn.querySelector("span");
          if (btnSpan) {
            btnSpan.textContent = "Processing...";
          }
          summarize_btn.style.backgroundColor = "var(--color-state-active)";
          result_p.textContent = '';

          const OPENAI_API_KEY = getPref('input') as string;
          const apiUrl = getPref('base') as string;
          const model = getPref('model') as string;

          // 只发送pdf内容，不包含用户输入
          var user_qtxt = pdftext.value;

          let system_prompt = getPrompt('summarize', lang);

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!model || model.trim() === '') {
            result_p.textContent = 'Model is not set. Please enter the model name in settings.';
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!user_qtxt.trim()) {
            result_p.textContent = 'Please enter some text to summarize.';
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }          let messages;          // 侧边栏只支持单轮对话模式
          messages = [
            { role: 'system', content: system_prompt },
            { role: 'user', content: user_qtxt }
          ];

          var requestData = {
            model: model,
            messages: messages,
            stream: true,
          };

          try {
            var response = await fetch(`${apiUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });

            if (!response.ok) {
              throw new Error(`Error: ${response.status} ${response.statusText}`);
            } else {
              result_p.textContent = '';

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let done = false;

              while (!done) {
                const { done: streamDone, value } = await reader!.read();
                done = streamDone;
                if (value) {
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n').filter(line => line.trim() !== '');

                  for (var line of lines) {
                    try {
                      line = line.replace('data:', '')
                      const data = JSON.parse(line);                      if (data.choices && data.choices[0]) {
                        const text = data.choices[0].delta?.content || '';
                        result_p.textContent += text;
                        // Accumulate the response for tracking
                        if (!currentResponse) currentResponse = '';
                        currentResponse += text;
                      }
                    } catch (error) {
                      ztoolkit.log("Could not parse JSON:", line);
                    }
                  }
                }
              }
                // 存储当前响应到文档特定的映射中
              documentResponses.set(itemId, currentResponse);
              
              // 单轮总结完成，保存当前响应供弹窗使用
            }
          } catch (error) {
            ztoolkit.log("Error", error);
            result_p.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          } finally {
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)";
            if (multiTurnActive) {
              userquery.value = '';
            }
          }
        }

        async function translate_text() {
          const btnSpan = translate_btn.querySelector("span");
          if (btnSpan) {
            btnSpan.textContent = "Processing...";
          }
          translate_btn.style.backgroundColor = "var(--color-state-active)";
          result_p.textContent = '';

          const OPENAI_API_KEY = getPref('input') as string;
          const apiUrl = getPref('base') as string;
          const model = getPref('model') as string;

          // 只发送pdf内容，不包含用户输入
          var user_qtxt = pdftext.value;

          let system_prompt = getPrompt('translate', lang);

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
            if (btnSpan) {
              btnSpan.textContent = "Translate";
            }
            translate_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!model || model.trim() === '') {
            result_p.textContent = 'Model is not set. Please enter the model name in settings.';
            if (btnSpan) {
              btnSpan.textContent = "Translate";
            }
            translate_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }
          if (!user_qtxt.trim()) {
            result_p.textContent = 'Please enter some text to translate.';
            if (btnSpan) {
              btnSpan.textContent = "Translate";
            }
            translate_btn.style.backgroundColor = "var(--color-background-secondary)";
            return;
          }          let messages;          // 侧边栏只支持单轮对话模式
          messages = [
            { role: 'system', content: system_prompt },
            { role: 'user', content: user_qtxt }
          ];

          var requestData = {
            model: model,
            messages: messages,
            stream: true,
          };

          try {
            var response = await fetch(`${apiUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });

            if (!response.ok) {
              throw new Error(`Error: ${response.status} ${response.statusText}`);
            } else {
              result_p.textContent = '';

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let done = false;

              while (!done) {
                const { done: streamDone, value } = await reader!.read();
                done = streamDone;
                if (value) {
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n').filter(line => line.trim() !== '');

                  for (var line of lines) {
                    try {
                      line = line.replace('data:', '')
                      const data = JSON.parse(line);                      if (data.choices && data.choices[0]) {
                        const text = data.choices[0].delta?.content || '';
                        result_p.textContent += text;
                        // Accumulate the response for tracking
                        if (!currentResponse) currentResponse = '';
                        currentResponse += text;
                      }
                    } catch (error) {
                      ztoolkit.log("Could not parse JSON:", line);
                    }
                  }
                }
              }
                // 存储当前响应到文档特定的映射中
              documentResponses.set(itemId, currentResponse);
              
              // 单轮翻译完成，保存当前响应供弹窗使用
            }
          } catch (error) {
            ztoolkit.log("Error", error);
            result_p.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          } finally {
            if (btnSpan) {
              btnSpan.textContent = "Translate";
            }
            translate_btn.style.backgroundColor = "var(--color-background-secondary)";
            if (multiTurnActive) {
              userquery.value = '';
            }
          }
        }

        // 弹窗多轮对话功能
        async function openMultiTurnDialog(itemId: string, pdfContent: string, lastResponse: string, language: string) {
          // 简单多语言字典
          const dict: Record<string, Record<string,string>> = {
            'en-US': {
              title: 'Multi-turn Chat',
              loading: 'Loading full PDF text...',
              loaded: 'Load full text',
              sendPdfFile: 'Send PDF file',
              loadError: 'Error loading PDF. Please retry.',
              noText: 'Cannot extract PDF text. Please check accessibility.',
              placeholder_loading: 'Waiting for full text...',
              placeholder_ready: 'Enter your question...',
              clear: 'Clear',
              clearAll: 'Clear All',
              send: 'Send',
              shortcutHint: 'Ctrl+Enter to send',
              thinking: 'Thinking...',
              uploadingPdf: 'Uploading PDF file...',
              apiConfigMissing: 'API configuration missing. Please check settings.',
              errorPrefix: 'Error',
              noResponse: 'No response',
              userLabel: 'You',
              aiLabel: 'AI'
            }
          };
          const L = (k: string) => (dict[language] || dict['en-US'])[k] || k;
          
          // 每次打开多轮对话都是全新的会话，不携带任何历史
          let dialogHistory: any[] = [];
          
          // 主题适配的弹窗HTML（支持 Zotero 深/浅色）
          const dialogHTML = `
            <div class="mt-dialog-root" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: var(--color-background-primary); color: var(--color-text-primary); width:100%; height:100%; box-sizing:border-box; padding:16px 20px 10px 20px; display:flex; flex-direction:column;">
              <style>
                .mt-dialog-root { font-size: 13px; }
                .mt-dialog-root h3 { margin:0 0 10px 0; font-size:15px; font-weight:600; }
                .mt-status { padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; margin-bottom:10px; background: var(--color-background-secondary); font-size:12px; }
                .mt-status.success { background: rgba(76,175,80,.15); border-color:#4caf50; color:#4caf50; }
                .mt-status.error { background: rgba(244,67,54,.15); border-color:#f44336; color:#f44336; }
                #chat-history { flex:1; min-height:250px; overflow-y:auto; border:1px solid var(--color-border); padding:12px; margin-bottom:10px; border-radius:4px; background: var(--color-background-secondary); }
                #chat-history::-webkit-scrollbar { width:8px; }
                #chat-history::-webkit-scrollbar-thumb { background: var(--color-border); border-radius:4px; }
                #dialog-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; resize:vertical; background: var(--color-background-secondary); color: var(--color-text-primary); font-family:inherit; font-size:12px; }
                .mt-btn-row { display:flex; justify-content:flex-end; gap:8px; margin:8px 0 0; }
                .mt-btn { padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; cursor:pointer; background: var(--color-background-secondary); color: var(--color-text-primary); transition: background .15s, border-color .15s; font-family:inherit; font-size:14px; display:flex; align-items:center; justify-content:center; }
                .mt-btn:hover:not([disabled]) { background: var(--color-background-tertiary, var(--color-background-secondary)); }
                .mt-btn[disabled] { opacity:.55; cursor:not-allowed; }
                .mt-btn.accent { border-color: var(--color-state-active,#5c9ded); }
                /* Neutral bubble scheme */
                /* Light mode bubble colors */
                .mt-msg { margin-bottom:8px; padding:9px 11px 9px 8px; border-radius:8px; line-height:1.5; word-break:break-word; border:1px solid #d2d4d7; }
                .mt-msg.user { background:#f1f2f3; margin-left:14px; border-left:4px solid #2196f3 !important; }
                .mt-msg.assistant { background:#f5f5f5; margin-right:14px; border-left:4px solid #4caf50 !important; }
                /* Dark mode overrides - triggered by JS */
                .dark-mode .mt-msg { border-color: #3a3a3a; }
                .dark-mode .mt-msg.user { background: #2a2a2a; border-left-color: #42a5f5 !important; }
                .dark-mode .mt-msg.assistant { background: #282828; border-left-color: #66bb6a !important; }
                .mt-msg strong { display:block; margin-bottom:4px; font-size:11px; opacity:.65; font-weight:600; color: var(--color-text-primary); }
                .mt-thinking { font-style:italic; opacity:.65; }
                .mt-label-assistant, .mt-label-user { color: var(--color-text-primary); }
                .mt-mode-btn { flex:1; padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; background:var(--color-background-secondary); cursor:pointer; font-family:inherit; font-size:14px; transition: all 0.2s; display:flex; align-items:center; justify-content:center; }
                .mt-mode-btn.active { background: #4caf50 !important; color: white !important; border-color: #4caf50 !important; font-weight: 500; }
                .mt-mode-btn:hover { opacity: 0.8; }
              </style>
              <h3>${L('title')}</h3>
              <div style="display:flex; gap:4px; margin-bottom:10px;">
                <button id="mode-fulltext" class="mt-mode-btn active">${L('loaded')}</button>
                <button id="mode-pdffile" class="mt-mode-btn">${L('sendPdfFile')}</button>
              </div>
              <div id="chat-history"></div>
              <textarea id="dialog-input" rows="3" placeholder="${L('placeholder_loading')}" disabled></textarea>
              <div class="mt-btn-row">
                <button id="clear-all-btn" class="mt-btn" type="button">${L('clearAll')}</button>
                <button id="send-btn" class="mt-btn accent" type="button" disabled>${L('send')}</button>
              </div>
            </div>`;

          // 创建弹窗
          const dialogData: any = {
            history: [...dialogHistory],
            fullPdfText: '',
            pdfFileData: null as { path: string; base64: string } | null,
            firstQuestionSent: false,
            loadCallback: async () => {
              // 使用 dialog.window 而不是 dialogData.window，避免 undefined 导致后续代码不执行
              const win = dialog.window;
              if (!win) {
                return;
              }
              const chatHistory = win.document.getElementById('chat-history') as HTMLDivElement | null;
              const input = win.document.getElementById('dialog-input') as HTMLTextAreaElement | null;
              const sendBtn = win.document.getElementById('send-btn') as HTMLButtonElement | null;
              const clearAllBtn = win.document.getElementById('clear-all-btn') as HTMLButtonElement | null;
              const modeFulltext = win.document.getElementById('mode-fulltext') as HTMLButtonElement | null;
              const modePdffile = win.document.getElementById('mode-pdffile') as HTMLButtonElement | null;
              // Fallback: 如果由于环境限制导致 innerHTML 中的按钮或样式被剥离，这里动态补全
              const root = win.document.querySelector('.mt-dialog-root') as HTMLElement | null;
              
              // 检测并应用深色模式
              if (root) {
                try {
                  let isDark = false;
                  const bodyBg = win?.document?.body ? (win.getComputedStyle?.(win.document.body)?.backgroundColor || '') : '';
                  // 检测 Zotero 深色模式：通过背景色判断（RGB值小于50视为深色）
                  const isZoteroDark = bodyBg.includes('rgb(') && parseInt(bodyBg.match(/\d+/)?.[0] || '255') < 50;
                  if (isDark || isZoteroDark) {
                    root.classList.add('dark-mode');
                  }
                } catch (e) {
                  // 如果检测失败，静默忽略
                }
              }
              
              // 如果样式被剥离（没有我们定义的 mt-status 类规则效果）且没有 style 标签，则注入一次
              if (root && !root.querySelector('style')) {
                const styleEl = win.document.createElement('style');
                styleEl.textContent = `
                  .mt-status { padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; margin-bottom:10px; background: var(--color-background-secondary); font-size:12px; }
                  .mt-status.success { background: rgba(76,175,80,.15); border-color:#4caf50; color:#4caf50; }
                  .mt-status.error { background: rgba(244,67,54,.15); border-color:#f44336; color:#f44336; }
                  #chat-history { flex:1; min-height:250px; overflow-y:auto; border:1px solid var(--color-border); padding:12px; margin-bottom:10px; border-radius:4px; background: var(--color-background-secondary); }
                  #dialog-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; resize:vertical; background: var(--color-background-secondary); color: var(--color-text-primary); font-family:inherit; }
                  .mt-btn-row { display:flex; justify-content:flex-end; gap:8px; margin:8px 0 0; }
                  .mt-btn { padding:6px 14px; border:1px solid var(--color-border); border-radius:4px; cursor:pointer; background: var(--color-background-secondary); color: var(--color-text-primary); transition: background .15s, border-color .15s; font-weight:500; }
                  .mt-btn:hover:not([disabled]) { background: var(--color-background-tertiary, var(--color-background-secondary)); }
                  .mt-btn[disabled] { opacity:.55; cursor:not-allowed; }
                  .mt-btn.accent { border-color: var(--color-state-active,#5c9ded); }
                  .mt-msg { margin-bottom:8px; padding:9px 11px 9px 8px; border-radius:8px; line-height:1.5; word-break:break-word; border:1px solid #d2d4d7; }
                  .mt-msg.user { background:#f1f2f3; margin-left:14px; border-left:4px solid #2196f3 !important; }
                  .mt-msg.assistant { background:#f5f5f5; margin-right:14px; border-left:4px solid #4caf50 !important; }
                  .dark-mode .mt-msg { border-color: #3a3a3a; }
                  .dark-mode .mt-msg.user { background: #2a2a2a; border-left-color: #42a5f5 !important; }
                  .dark-mode .mt-msg.assistant { background: #282828; border-left-color: #66bb6a !important; }
                  .mt-msg strong { display:block; margin-bottom:4px; font-size:11px; opacity:.65; font-weight:600; color: var(--color-text-primary); }
                  .mt-thinking { font-style:italic; opacity:.65; }
                  .mt-label-assistant, .mt-label-user { color: var(--color-text-primary); }
                  .mt-mode-btn { flex:1; padding:8px; border:1px solid var(--color-border); border-radius:4px; background:var(--color-background-secondary); cursor:pointer; font-size:13px; transition: all 0.2s; }
                  .mt-mode-btn.active { background: #4caf50 !important; color: white !important; border-color: #4caf50 !important; font-weight: 500; }
                  .mt-mode-btn:hover { opacity: 0.8; }
                `;
                root.appendChild(styleEl);
              }
              // 如果模式按钮缺失则创建
              if (root && !modeFulltext && !modePdffile) {
                const modeContainer = win.document.createElement('div');
                modeContainer.style.cssText = 'display:flex; gap:8px; margin-bottom:10px;';
                
                const btnFulltext = win.document.createElement('button');
                btnFulltext.id = 'mode-fulltext';
                btnFulltext.className = 'mt-mode-btn active';
                btnFulltext.textContent = L('loaded');
                
                const btnPdffile = win.document.createElement('button');
                btnPdffile.id = 'mode-pdffile';
                btnPdffile.className = 'mt-mode-btn';
                btnPdffile.textContent = L('sendPdfFile');
                
                modeContainer.appendChild(btnFulltext);
                modeContainer.appendChild(btnPdffile);
                
                // 插入到chat-history之前
                const chatHistory = win.document.getElementById('chat-history');
                if (chatHistory && chatHistory.parentElement) {
                  chatHistory.parentElement.insertBefore(modeContainer, chatHistory);
                } else {
                  root.appendChild(modeContainer);
                }
              }
              
              // 如果按钮缺失则重新创建
              if (root && !sendBtn) {
                const btnRow = win.document.createElement('div');
                btnRow.className = 'mt-btn-row';
                const clearAllBtn2 = win.document.createElement('button');
                clearAllBtn2.id = 'clear-all-btn';
                clearAllBtn2.type = 'button';
                clearAllBtn2.className = 'mt-btn';
                clearAllBtn2.textContent = L('clearAll');
                const sendBtn2 = win.document.createElement('button');
                sendBtn2.id = 'send-btn';
                sendBtn2.type = 'button';
                sendBtn2.className = 'mt-btn accent';
                sendBtn2.textContent = L('send');
                sendBtn2.disabled = true;
                btnRow.appendChild(clearAllBtn2);
                btnRow.appendChild(sendBtn2);
                // 插入到输入框之后
                const inputRef = win.document.getElementById('dialog-input');
                if (inputRef && inputRef.parentElement) {
                  inputRef.parentElement.insertBefore(btnRow, inputRef.nextSibling);
                } else {
                  root.appendChild(btnRow);
                }
              }
              // 重新获取（可能刚被创建）
              const _sendBtn = win.document.getElementById('send-btn') as HTMLButtonElement | null;
              const _clearAllBtn = win.document.getElementById('clear-all-btn') as HTMLButtonElement | null;
              const _modeFulltext = win.document.getElementById('mode-fulltext') as HTMLButtonElement | null;
              const _modePdffile = win.document.getElementById('mode-pdffile') as HTMLButtonElement | null;
              // 用重新获取的引用替换原引用（如果原先为 null）
              const effectiveSendBtn = sendBtn || _sendBtn;
              const effectiveClearAllBtn = win.document.getElementById('clear-all-btn') as HTMLButtonElement | null;
              const effectiveModeFulltext = modeFulltext || _modeFulltext;
              const effectiveModePdffile = modePdffile || _modePdffile;
              
              // 自动加载PDF全文
              try {
                const attachments = await item.getAttachments();
                let pdfText = null;
                let pdfAttachment = null;

                for (const attachmentID of attachments) {
                  const attachment = await Zotero.Items.getAsync(attachmentID);
                  if (attachment.attachmentContentType === 'application/pdf') {
                    pdfText = await attachment.attachmentText;
                    pdfAttachment = attachment;
                    break;
                  }
                }

                if (pdfText && pdfAttachment) {
                  const cleanedText = cleanPdfText(pdfText);
                  dialogData.fullPdfText = cleanedText;
                  
                  // 获取PDF文件路径和Base64编码
                  try {
                    const pdfPath = await pdfAttachment.getFilePathAsync();
                    if (pdfPath) {
                      // 读取PDF文件
                      const fileData: any = await Zotero.File.getBinaryContentsAsync(pdfPath);
                      // 转换为Base64
                      let base64: string;
                      if (typeof fileData === 'string') {
                        // 如果返回的是字符串，直接使用btoa
                        base64 = btoa(fileData);
                      } else {
                        // 如果返回的是ArrayBuffer
                        const uint8Array = new Uint8Array(fileData as ArrayBuffer);
                        let binaryString = '';
                        for (let i = 0; i < uint8Array.length; i++) {
                          binaryString += String.fromCharCode(uint8Array[i]);
                        }
                        base64 = btoa(binaryString);
                      }
                      dialogData.pdfFileData = {
                        path: pdfPath,
                        base64: base64
                      };
                      ztoolkit.log('PDF file loaded for direct sending:', pdfPath);
                    }
                  } catch (err) {
                    ztoolkit.log('Failed to load PDF file for direct sending:', err);
                  }
                  
                  // 如果历史为空，初始化系统提示
                  if (dialogData.history.length === 0) {
                    const systemPrompt = getPrompt('system_multi_turn', language);
                    dialogData.history = [
                      { role: 'system', content: systemPrompt }
                    ];
                  }
                  
                  // 启用输入框和发送按钮
                  if (input) {
                    input.disabled = false;
                    input.placeholder = L('placeholder_ready');
                  }
                  if (effectiveSendBtn) {
                    effectiveSendBtn.disabled = false;
                  }
                }
              } catch (error) {
                ztoolkit.log('Error loading PDF:', error);
              }
              
              // 显示现有历史
              if (dialogData.history.length > 0) {
                for (const msg of dialogData.history) {
                  if (msg.role !== 'system') {
                    appendMessage(chatHistory, msg.role, msg.content);
                  }
                }
              }
              
              // 发送消息
              const sendMessage = async () => {
                if (!input || !input.value.trim()) return;
                if (!dialogData.fullPdfText && !dialogData.pdfFileData) return; // 未加载PDF不发送
                
                const userMessage = input.value.trim();
                input.value = '';
                
                const OPENAI_API_KEY = getPref('input') as string;
                const apiUrl = getPref('base') as string;
                const model = getPref('model') as string;
                
                if (!OPENAI_API_KEY || !apiUrl || !model) {
                  appendMessage(chatHistory, 'assistant', `<strong>${L('aiLabel')}</strong>${L('apiConfigMissing')}`);
                  return;
                }
                
                // 检查是否选择直接发送PDF
                const usePdfFile = effectiveModePdffile?.classList.contains('active') && dialogData.pdfFileData;
                
                // 构建消息内容
                let messageContent: any;
                let thinkingMsg: any;
                
                if (usePdfFile && !dialogData.firstQuestionSent) {
                  // 首次使用PDF文件格式发送
                  appendMessage(chatHistory, 'user', userMessage);
                  thinkingMsg = appendMessage(chatHistory, 'assistant', `<span class="mt-thinking">${L('thinking')}</span>`);
                  
                  // 构建符合OpenRouter/OpenAI规范的消息格式
                  // 所有API都使用相同的base64格式
                  messageContent = [
                    {
                      type: "text",
                      text: userMessage
                    },
                    {
                      type: "file",
                      file: {
                        filename: "document.pdf",
                        file_data: `data:application/pdf;base64,${dialogData.pdfFileData.base64}`
                      }
                    }
                  ];
                  
                  dialogData.firstQuestionSent = true;
                } else if (!dialogData.firstQuestionSent) {
                  // 首次使用文本方式（原来的逻辑）
                  messageContent = dialogData.fullPdfText + '\n\n' + 'User Question: ' + userMessage;
                  dialogData.firstQuestionSent = true;
                  appendMessage(chatHistory, 'user', userMessage);
                  thinkingMsg = appendMessage(chatHistory, 'assistant', `<span class="mt-thinking">${L('thinking')}</span>`);
                } else {
                  // 后续问题直接发送
                  messageContent = userMessage;
                  appendMessage(chatHistory, 'user', userMessage);
                  thinkingMsg = appendMessage(chatHistory, 'assistant', `<span class="mt-thinking">${L('thinking')}</span>`);
                }
                
                // 添加到历史记录
                dialogData.history.push({ role: 'user', content: messageContent });
                
                try {
                  // 准备请求体
                  const requestBody: any = {
                    model: model,
                    messages: dialogData.history,
                    stream: true,
                  };
                  
                  // 如果使用PDF文件且不是OpenAI官方API，添加plugins参数（OpenRouter/new-api格式）
                  if (usePdfFile && dialogData.firstQuestionSent && !apiUrl.includes('api.openai.com')) {
                    const pdfEngine = getPref('pdfEngine') as string || 'auto';
                    // 添加 plugins 参数来指定PDF处理引擎
                    // 支持的引擎:
                    // - auto: OpenRouter自动选择（优先native，否则mistral-ocr）
                    // - mistral-ocr: 适用于扫描文档或含图片的PDF ($2/1000页)
                    // - pdf-text: 适用于结构清晰、文本内容明确的PDF (免费)
                    // - native: 仅用于原生支持文件输入的模型（按输入token计费）
                    
                    // 只有在非auto模式下才添加plugins参数
                    // auto模式让OpenRouter自动选择（优先native，然后mistral-ocr）
                    if (pdfEngine !== 'auto') {
                      requestBody.plugins = [
                        {
                          id: 'file-parser',
                          pdf: {
                            engine: pdfEngine
                          }
                        }
                      ];
                    }
                  }
                  
                  // 启用流式输出
                  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${OPENAI_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                  });
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
                  }
                  
                  // 清除"思考中"提示，准备接收流式数据
                  thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>`;
                  let aiResponse = '';
                  
                  // 处理流式响应
                  const reader = response.body?.getReader();
                  const decoder = new TextDecoder('utf-8');
                  
                  if (!reader) {
                    throw new Error('No response body reader available');
                  }
                  
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');
                    
                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6); // 移除 "data: " 前缀
                        
                        if (data === '[DONE]') {
                          continue;
                        }
                        
                        try {
                          const parsed = JSON.parse(data);
                          const content = parsed.choices?.[0]?.delta?.content;
                          
                          if (content) {
                            aiResponse += content;
                            // 实时更新显示，将换行符转为 <br>
                            thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${aiResponse.replace(/\n/g, '<br>')}`;
                            // 自动滚动到底部
                            if (chatHistory) {
                              chatHistory.scrollTop = chatHistory.scrollHeight;
                            }
                          }
                        } catch (e) {
                          // 忽略解析错误的数据块
                          continue;
                        }
                      }
                    }
                  }
                  
                  // 流式输出完成后，保存完整响应到历史
                  if (aiResponse) {
                    dialogData.history.push({ role: 'assistant', content: aiResponse });
                    documentHistories.set(itemId, dialogData.history);
                  } else {
                    thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${L('noResponse')}`;
                  }
                  
                } catch (error) {
                  thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${L('errorPrefix')}: ${error instanceof Error ? error.message : 'Unknown'}`;
                }
              };
              
              // 模式切换按钮事件
              effectiveModeFulltext?.addEventListener('click', () => {
                effectiveModeFulltext.classList.add('active');
                effectiveModePdffile?.classList.remove('active');
              });
              
              effectiveModePdffile?.addEventListener('click', () => {
                effectiveModePdffile.classList.add('active');
                effectiveModeFulltext?.classList.remove('active');
              });
              
              effectiveSendBtn?.addEventListener('click', sendMessage);
              input?.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  sendMessage();
                }
              });
              
              effectiveClearAllBtn?.addEventListener('click', () => {
                // 清除全部历史并重置首次发送标记
                dialogData.history = [];
                if (chatHistory) chatHistory.innerHTML = '';
                dialogData.firstQuestionSent = false;
                documentHistories.set(itemId, dialogData.history);
              });
            },
            unloadCallback: () => {
              // 关闭弹窗时保存历史
              documentHistories.set(itemId, dialogData.history);
            }
          };

          const dialog = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0, {
              tag: 'div',
              properties: { innerHTML: dialogHTML }
            })
            .setDialogData(dialogData)
            .open(L('title'), { resizable: true, centerscreen: true, width: 700, height: 550 });

          // 设置最小窗口尺寸
          if (dialog.window) {
            try {
              dialog.window.document.documentElement.style.minWidth = '500px';
              dialog.window.document.documentElement.style.minHeight = '400px';
            } catch (e) { /* ignore */ }
          }

          function appendMessage(container: any, role: string, content: string) {
            if (!container) return;
            const messageDiv = container.ownerDocument.createElement('div');
            messageDiv.className = `mt-msg ${role}`;
            const labelClass = role === 'assistant' ? 'mt-label-assistant' : 'mt-label-user';
            messageDiv.innerHTML = `<strong class="${labelClass}">${role === 'user' ? L('userLabel') : L('aiLabel')}</strong>${content.replace(/\n/g, '<br>')}`;
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
            return messageDiv;
          }
        }

        uquery_btn.addEventListener('click', ask_question);
        translate_btn.addEventListener('click', translate_text);
        summarize_btn.addEventListener('click', summarize_text);
      },
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },
    });
  }
}

// Multi-item dialog function (for multi-selection support)
async function openMultiItemsDialog(items: any[], language: string) {
  const dict: Record<string, Record<string,string>> = {
    'en-US': {
      title: 'Multi-turn Chat with Papers',
      loadingPdfs: 'Loading PDFs...',
      loaded: 'Load full text',
      sendPdfFile: 'Send PDF file',
      loadError: 'Error loading PDFs. Please retry.',
      noText: 'Cannot extract text from some PDFs.',
      placeholder_loading: 'Waiting for PDFs to load...',
      placeholder_ready: 'Enter your question about the selected papers...',
      clear: 'Clear',
      clearAll: 'Clear All',
      send: 'Send',
      shortcutHint: 'Ctrl+Enter to send',
      thinking: 'Thinking...',
      uploadingPdf: 'Uploading PDF files...',
      apiConfigMissing: 'API configuration missing. Please check settings.',
      errorPrefix: 'Error',
      noResponse: 'No response',
      userLabel: 'You',
      aiLabel: 'AI',
      papersLoaded: 'papers loaded',
      loadingStatus: 'Loading papers...',
      pdfFileNotSupported: 'Note: PDF file mode only works with single paper selection. Using text mode instead.'
    }
  };
  const L = (k: string) => (dict[language] || dict['en-US'])[k] || k;
  
  // Multi-turn dialog history for this session
  let dialogHistory: any[] = [];
  
  const dialogHTML = `
    <div class="mt-dialog-root" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: var(--color-background-primary); color: var(--color-text-primary); width:100%; height:100%; box-sizing:border-box; padding:16px 20px 10px 20px; display:flex; flex-direction:column;">
      <style>
        .mt-dialog-root { font-size: 13px; }
        .mt-dialog-root h3 { margin:0 0 10px 0; font-size:15px; font-weight:600; }
        .mt-status { padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; margin-bottom:10px; background: var(--color-background-secondary); font-size:12px; }
        .mt-status.success { background: rgba(76,175,80,.15); border-color:#4caf50; color:#4caf50; }
        .mt-status.error { background: rgba(244,67,54,.15); border-color:#f44336; color:#f44336; }
        #chat-history { flex:1; min-height:250px; overflow-y:auto; border:1px solid var(--color-border); padding:12px; margin-bottom:10px; border-radius:4px; background: var(--color-background-secondary); }
        #chat-history::-webkit-scrollbar { width:8px; }
        #chat-history::-webkit-scrollbar-thumb { background: var(--color-border); border-radius:4px; }
        #dialog-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; resize:vertical; background: var(--color-background-secondary); color: var(--color-text-primary); font-family:inherit; }
        .mt-btn-row { display:flex; justify-content:flex-end; gap:8px; margin:8px 0 0; }
        .mt-btn { padding:6px 14px; border:1px solid var(--color-border); border-radius:4px; cursor:pointer; background: var(--color-background-secondary); color: var(--color-text-primary); transition: background .15s, border-color .15s; font-weight:500; }
        .mt-btn:hover:not([disabled]) { background: var(--color-background-tertiary, var(--color-background-secondary)); }
        .mt-btn[disabled] { opacity:.55; cursor:not-allowed; }
        .mt-btn.accent { border-color: var(--color-state-active,#5c9ded); }
        .mt-msg { margin-bottom:8px; padding:9px 11px 9px 8px; border-radius:8px; line-height:1.5; word-break:break-word; border:1px solid #d2d4d7; }
        .mt-msg.user { background:#f1f2f3; margin-left:14px; border-left:4px solid #2196f3 !important; }
        .mt-msg.assistant { background:#f5f5f5; margin-right:14px; border-left:4px solid #4caf50 !important; }
        .dark-mode .mt-msg { border-color: #3a3a3a; }
        .dark-mode .mt-msg.user { background: #2a2a2a; border-left-color: #42a5f5 !important; }
        .dark-mode .mt-msg.assistant { background: #282828; border-left-color: #66bb6a !important; }
        .mt-msg strong { display:block; margin-bottom:4px; font-size:11px; opacity:.65; font-weight:600; color: var(--color-text-primary); }
        .mt-thinking { font-style:italic; opacity:.65; }
        .mt-label-assistant, .mt-label-user { color: var(--color-text-primary); }
        .mt-mode-btn { flex:1; padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; background:var(--color-background-secondary); cursor:pointer; font-family:inherit; font-size:14px; transition: all 0.2s; display:flex; align-items:center; justify-content:center; }
        .mt-mode-btn.active { background: #4caf50 !important; color: white !important; border-color: #4caf50 !important; font-weight: 500; }
        .mt-mode-btn:hover { opacity: 0.8; }
      </style>
      <h3>${L('title')}</h3>
      <div style="display:flex; gap:4px; margin-bottom:10px;">
        <button id="mode-fulltext" class="mt-mode-btn active">${L('loaded')}</button>
        <button id="mode-pdffile" class="mt-mode-btn">${L('sendPdfFile')}</button>
      </div>
      <div id="status-bar" class="mt-status">${L('loadingStatus')}</div>
      <div id="chat-history"></div>
      <textarea id="dialog-input" rows="3" placeholder="${L('placeholder_loading')}" disabled style="font-family:inherit; font-size:12px;"></textarea>
      <div class="mt-btn-row">
        <button id="clear-all-btn" class="mt-btn" type="button">${L('clearAll')}</button>
        <button id="send-btn" class="mt-btn accent" type="button" disabled>${L('send')}</button>
      </div>
    </div>`;
  
  const dialogData: any = {
    history: [...dialogHistory],
    fullPdfTexts: [] as string[],
    pdfFileData: [] as Array<{ path: string; base64: string; title: string }>,
    itemTitles: [] as string[],
    firstQuestionSent: false,
    loadCallback: async () => {
      const win = dialog.window;
      if (!win) return;
      
      const chatHistory = win.document.getElementById('chat-history') as HTMLDivElement | null;
      const input = win.document.getElementById('dialog-input') as HTMLTextAreaElement | null;
      const sendBtn = win.document.getElementById('send-btn') as HTMLButtonElement | null;
      const clearAllBtn = win.document.getElementById('clear-all-btn') as HTMLButtonElement | null;
      const statusBar = win.document.getElementById('status-bar') as HTMLDivElement | null;
      const root = win.document.querySelector('.mt-dialog-root') as HTMLElement | null;
      const modeFulltext = win.document.getElementById('mode-fulltext') as HTMLButtonElement | null;
      const modePdffile = win.document.getElementById('mode-pdffile') as HTMLButtonElement | null;
      
      // Helper function to append messages
      const appendMessage = (container: any, role: string, content: string) => {
        if (!container) return;
        const messageDiv = container.ownerDocument.createElement('div');
        messageDiv.className = `mt-msg ${role}`;
        const labelClass = role === 'assistant' ? 'mt-label-assistant' : 'mt-label-user';
        messageDiv.innerHTML = `<strong class="${labelClass}">${role === 'user' ? L('userLabel') : L('aiLabel')}</strong>${content.replace(/\n/g, '<br>')}`;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        return messageDiv;
      };
      
      // Detect dark mode
      if (root) {
        try {
          const bodyBg = win?.document?.body ? (win.getComputedStyle?.(win.document.body)?.backgroundColor || '') : '';
          const isZoteroDark = bodyBg.includes('rgb(') && parseInt(bodyBg.match(/\d+/)?.[0] || '255') < 50;
          if (isZoteroDark) {
            root.classList.add('dark-mode');
          }
        } catch (e) {
          // Silent fail
        }
      }
      
      // Fallback: if styles are missing, inject them
      if (root && !root.querySelector('style')) {
        const styleEl = win.document.createElement('style');
        styleEl.textContent = `
          .mt-dialog-root { font-size: 13px; }
          .mt-dialog-root h3 { margin:0 0 10px 0; font-size:15px; font-weight:600; }
          .mt-status { padding:8px 10px; border:1px solid var(--color-border); border-radius:4px; margin-bottom:10px; background: var(--color-background-secondary); font-size:12px; }
          .mt-status.success { background: rgba(76,175,80,.15); border-color:#4caf50; color:#4caf50; }
          .mt-status.error { background: rgba(244,67,54,.15); border-color:#f44336; color:#f44336; }
          #chat-history { flex:1; min-height:250px; overflow-y:auto; border:1px solid var(--color-border); padding:12px; margin-bottom:10px; border-radius:4px; background: var(--color-background-secondary); }
          #chat-history::-webkit-scrollbar { width:8px; }
          #chat-history::-webkit-scrollbar-thumb { background: var(--color-border); border-radius:4px; }
          #dialog-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--color-border); border-radius:2px; resize:vertical; background: var(--color-background-secondary); color: var(--color-text-primary); font-family:inherit; font-size:12px; }
          .mt-btn-row { display:flex; justify-content:flex-end; gap:4px; margin:8px 0 0; }
          .mt-btn { padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; cursor:pointer; background: var(--color-background-secondary); color: var(--color-text-primary); transition: background .15s, border-color .15s; font-family:inherit; font-size:14px; display:flex; align-items:center; justify-content:center; }
          .mt-btn:hover:not([disabled]) { background: var(--color-background-tertiary, var(--color-background-secondary)); }
          .mt-btn[disabled] { opacity:.55; cursor:not-allowed; }
          .mt-btn.accent { border-color: var(--color-state-active,#5c9ded); }
          .mt-msg { margin-bottom:8px; padding:9px 11px 9px 8px; border-radius:8px; line-height:1.5; word-break:break-word; border:1px solid #d2d4d7; }
          .mt-msg.user { background:#f1f2f3; margin-left:14px; border-left:4px solid #2196f3 !important; }
          .mt-msg.assistant { background:#f5f5f5; margin-right:14px; border-left:4px solid #4caf50 !important; }
          .dark-mode .mt-msg { border-color: #3a3a3a; }
          .dark-mode .mt-msg.user { background: #2a2a2a; border-left-color: #42a5f5 !important; }
          .dark-mode .mt-msg.assistant { background: #282828; border-left-color: #66bb6a !important; }
          .mt-msg strong { display:block; margin-bottom:4px; font-size:11px; opacity:.65; font-weight:600; color: var(--color-text-primary); }
          .mt-thinking { font-style:italic; opacity:.65; }
          .mt-label-assistant, .mt-label-user { color: var(--color-text-primary); }
          .mt-mode-btn { flex:1; padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; background:var(--color-background-secondary); cursor:pointer; font-family:inherit; font-size:14px; transition: all 0.2s; display:flex; align-items:center; justify-content:center; }
          .mt-mode-btn.active { background: #4caf50 !important; color: white !important; border-color: #4caf50 !important; font-weight: 500; }
          .mt-mode-btn:hover { opacity: 0.8; }
        `;
        root.appendChild(styleEl);
      }
      
      // Fallback: if mode buttons are missing, create them
      if (root && !modeFulltext && !modePdffile) {
        const modeContainer = win.document.createElement('div');
        modeContainer.style.cssText = 'display:flex; gap:8px; margin-bottom:10px;';
        
        const btnFulltext = win.document.createElement('button');
        btnFulltext.id = 'mode-fulltext';
        btnFulltext.className = 'mt-mode-btn active';
        btnFulltext.textContent = L('loaded');
        btnFulltext.style.cssText = 'flex:1; padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; background:#4caf50; color:white; border-color:#4caf50; cursor:pointer; font-family:inherit; font-size:14px; font-weight:500; display:flex; align-items:center; justify-content:center;';
        
        const btnPdffile = win.document.createElement('button');
        btnPdffile.id = 'mode-pdffile';
        btnPdffile.className = 'mt-mode-btn';
        btnPdffile.textContent = L('sendPdfFile');
        btnPdffile.style.cssText = 'flex:1; padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; background:var(--color-background-secondary); cursor:pointer; font-family:inherit; font-size:14px; display:flex; align-items:center; justify-content:center;';
        
        modeContainer.appendChild(btnFulltext);
        modeContainer.appendChild(btnPdffile);
        
        // Insert before status bar
        const statusBarRef = win.document.getElementById('status-bar');
        if (statusBarRef && statusBarRef.parentElement) {
          statusBarRef.parentElement.insertBefore(modeContainer, statusBarRef);
        } else if (root) {
          root.insertBefore(modeContainer, root.firstChild?.nextSibling || null);
        }
      }
      
      // Fallback: if buttons are missing, create them dynamically
      if (root && !sendBtn) {
        const btnRow = win.document.createElement('div');
        btnRow.className = 'mt-btn-row';
        btnRow.style.cssText = 'display:flex; justify-content:flex-end; gap:8px; margin:8px 0 0;';
        
        const clearAllBtn2 = win.document.createElement('button');
        clearAllBtn2.id = 'clear-all-btn';
        clearAllBtn2.type = 'button';
        clearAllBtn2.className = 'mt-btn';
        clearAllBtn2.textContent = L('clearAll');
        clearAllBtn2.style.cssText = 'padding:4px 8px; border:1px solid var(--color-border); border-radius:2px; cursor:pointer; background: var(--color-background-secondary); color: var(--color-text-primary); font-family:inherit; font-size:14px; display:flex; align-items:center; justify-content:center;';
        
        const sendBtn2 = win.document.createElement('button');
        sendBtn2.id = 'send-btn';
        sendBtn2.type = 'button';
        sendBtn2.className = 'mt-btn accent';
        sendBtn2.textContent = L('send');
        sendBtn2.disabled = true;
        sendBtn2.style.cssText = 'padding:4px 8px; border:1px solid var(--color-state-active,#5c9ded); border-radius:2px; cursor:pointer; background: var(--color-background-secondary); color: var(--color-text-primary); font-family:inherit; font-size:14px; display:flex; align-items:center; justify-content:center;';
        
        btnRow.appendChild(clearAllBtn2);
        btnRow.appendChild(sendBtn2);
        
        // Insert after input field
        const inputRef = win.document.getElementById('dialog-input');
        if (inputRef && inputRef.parentElement) {
          inputRef.parentElement.insertBefore(btnRow, inputRef.nextSibling);
        } else if (root) {
          root.appendChild(btnRow);
        }
      }
      
      // Re-fetch button references (in case they were just created)
      const _sendBtn = win.document.getElementById('send-btn') as HTMLButtonElement | null;
      const _clearAllBtn = win.document.getElementById('clear-all-btn') as HTMLButtonElement | null;
      const _modeFulltext = win.document.getElementById('mode-fulltext') as HTMLButtonElement | null;
      const _modePdffile = win.document.getElementById('mode-pdffile') as HTMLButtonElement | null;
      const effectiveSendBtn = sendBtn || _sendBtn;
      const effectiveClearAllBtn = clearAllBtn || _clearAllBtn;
      const effectiveModeFulltext = modeFulltext || _modeFulltext;
      const effectiveModePdffile = modePdffile || _modePdffile;
      
      // Load all PDFs
      try {
        let loadedCount = 0;
        
        for (const item of items) {
          const title = item.getField('title') || 'Untitled';
          dialogData.itemTitles.push(title);
          
          const attachments = await item.getAttachments();
          let pdfText = null;
          
          for (const attachmentID of attachments) {
            const attachment = await Zotero.Items.getAsync(attachmentID);
            if (attachment.attachmentContentType === 'application/pdf') {
              pdfText = await attachment.attachmentText;
              break;
            }
          }
          
          if (pdfText) {
            const cleanedText = cleanPdfText(pdfText);
            dialogData.fullPdfTexts.push(`[Paper ${loadedCount + 1}: "${title}"]
${cleanedText}`);
            
            // Try to load PDF file for direct sending
            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === 'application/pdf') {
                try {
                  const pdfPath = await attachment.getFilePathAsync();
                  if (pdfPath) {
                    const fileData: any = await Zotero.File.getBinaryContentsAsync(pdfPath);
                    let base64: string;
                    if (typeof fileData === 'string') {
                      base64 = btoa(fileData);
                    } else {
                      const uint8Array = new Uint8Array(fileData as ArrayBuffer);
                      let binaryString = '';
                      for (let i = 0; i < uint8Array.length; i++) {
                        binaryString += String.fromCharCode(uint8Array[i]);
                      }
                      base64 = btoa(binaryString);
                    }
                    dialogData.pdfFileData.push({
                      path: pdfPath,
                      base64: base64,
                      title: title
                    });
                  }
                } catch (err) {
                  ztoolkit.log(`Failed to load PDF file for ${title}:`, err);
                }
                break;
              }
            }
            
            loadedCount++;
            
            if (statusBar) {
              statusBar.textContent = `${loadedCount} ${L('papersLoaded')}...`;
            }
          } else {
            dialogData.fullPdfTexts.push(`[Paper ${loadedCount + 1}: "${title}"]
[PDF text not available]`);
          }
        }
        
        // Initialize system prompt
        if (dialogData.history.length === 0) {
          const systemPrompt = getPrompt('system_multi_turn', language);
          dialogData.history = [
            { role: 'system', content: systemPrompt }
          ];
        }
        
        // Enable input
        if (input) {
          input.disabled = false;
          input.placeholder = L('placeholder_ready');
        }
        if (effectiveSendBtn) {
          effectiveSendBtn.disabled = false;
        }
        if (statusBar) {
          statusBar.className = 'mt-status success';
          const pdfFileCount = dialogData.pdfFileData.length;
          if (pdfFileCount === loadedCount) {
            statusBar.textContent = `${loadedCount} ${L('papersLoaded')} (Text ✓ / PDF Files ✓)`;
          } else {
            statusBar.textContent = `${loadedCount} ${L('papersLoaded')} (Text ✓ / PDF Files: ${pdfFileCount})`;
          }
        }
        
      } catch (error) {
        ztoolkit.log('Error loading PDFs:', error);
        if (statusBar) {
          statusBar.className = 'mt-status error';
          statusBar.textContent = L('loadError');
        }
      }
      
      // Send message function
      const sendMessage = async () => {
        if (!input || !input.value.trim()) return;
        
        // Check if data is loaded based on selected mode
        const usePdfFileMode = effectiveModePdffile?.classList.contains('active');
        if (usePdfFileMode) {
          if (dialogData.pdfFileData.length === 0) {
            appendMessage(chatHistory, 'assistant', `<strong>${L('aiLabel')}</strong>PDF files not loaded. Please wait or switch to text mode.`);
            return;
          }
        } else {
          if (dialogData.fullPdfTexts.length === 0) {
            appendMessage(chatHistory, 'assistant', `<strong>${L('aiLabel')}</strong>PDF texts not loaded. Please wait or switch to PDF file mode.`);
            return;
          }
        }
        
        const userMessage = input.value.trim();
        input.value = '';
        
        const OPENAI_API_KEY = getPref('input') as string;
        const apiUrl = getPref('base') as string;
        // 使用多篇论文对话专用模型，如果未设置则回退到普通模型
        let model = getPref('multiModel') as string;
        if (!model || model.trim() === '') {
          model = getPref('model') as string;
        }
        
        if (!OPENAI_API_KEY || !apiUrl || !model) {
          appendMessage(chatHistory, 'assistant', `<strong>${L('aiLabel')}</strong>${L('apiConfigMissing')}`);
          return;
        }
        
        // Build message content
        let messageContent: any;
        let thinkingMsg: any;
        
        if (!dialogData.firstQuestionSent) {
          // Check if using PDF file mode
          const usePdfFile = effectiveModePdffile?.classList.contains('active') && dialogData.pdfFileData.length > 0;
          
          if (usePdfFile) {
            // PDF file mode: send multiple PDF files
            const isOpenAIOfficial = apiUrl.includes('api.openai.com');
            
            appendMessage(chatHistory, 'user', userMessage);
            thinkingMsg = appendMessage(chatHistory, 'assistant', `<span class="mt-thinking">${L('uploadingPdf')}</span>`);
            
            if (isOpenAIOfficial) {
              // OpenAI official API: upload files and use file_id
              try {
                const fileIds = [];
                for (const pdfData of dialogData.pdfFileData) {
                  const blob = new Blob([Uint8Array.from(atob(pdfData.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
                  const formData = new FormData();
                  formData.append('file', blob, `${pdfData.title}.pdf`);
                  formData.append('purpose', 'user_data');
                  
                  const uploadResponse = await fetch(`${apiUrl}/v1/files`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: formData,
                  });
                  
                  if (!uploadResponse.ok) {
                    throw new Error(`File upload failed for "${pdfData.title}": ${uploadResponse.status}`);
                  }
                  
                  const fileData: any = await uploadResponse.json();
                  fileIds.push(fileData.id);
                }
                
                // Build message content with multiple file_ids
                messageContent = fileIds.map(fileId => ({
                  type: 'file',
                  file: { file_id: fileId }
                }));
                messageContent.push({
                  type: 'text',
                  text: userMessage
                });
                
                thinkingMsg.innerHTML = `<span class="mt-thinking">${L('thinking')}</span>`;
              } catch (error) {
                thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${L('errorPrefix')}: ${error instanceof Error ? error.message : 'Upload failed'}`;
                return;
              }
            } else {
              // Non-OpenAI API: use base64 format
              messageContent = dialogData.pdfFileData.map((pdfData: any) => ({
                type: 'file',
                file: {
                  filename: `${pdfData.title}.pdf`,
                  file_data: `data:application/pdf;base64,${pdfData.base64}`
                }
              }));
              messageContent.push({
                type: 'text',
                text: userMessage
              });
              thinkingMsg.innerHTML = `<span class="mt-thinking">${L('thinking')}</span>`;
            }
          } else {
            // Text mode: include all PDF texts
            const combinedPdfText = dialogData.fullPdfTexts.join('\n\n---\n\n');
            messageContent = combinedPdfText + '\n\n' + 'User Question: ' + userMessage;
            appendMessage(chatHistory, 'user', userMessage);
            thinkingMsg = appendMessage(chatHistory, 'assistant', `<span class="mt-thinking">${L('thinking')}</span>`);
          }
          
          dialogData.firstQuestionSent = true;
        } else {
          // Subsequent questions
          messageContent = userMessage;
          appendMessage(chatHistory, 'user', userMessage);
          thinkingMsg = appendMessage(chatHistory, 'assistant', `<span class="mt-thinking">${L('thinking')}</span>`);
        }
        
        // Add to history
        dialogData.history.push({ role: 'user', content: messageContent });
        
        try {
          const requestBody: any = {
            model: model,
            messages: dialogData.history,
            stream: true,
          };
          
          // If using PDF file mode with non-OpenAI API, add plugins parameter
          const usePdfFile = effectiveModePdffile?.classList.contains('active') && dialogData.pdfFileData.length > 0;
          if (usePdfFile && !apiUrl.includes('api.openai.com')) {
            const pdfEngine = getPref('pdfEngine') as string || 'auto';
            // 添加 plugins 参数来指定PDF处理引擎
            // 支持的引擎:
            // - auto: OpenRouter自动选择（优先native，否则mistral-ocr）
            // - mistral-ocr: 适用于扫描文档或含图片的PDF ($2/1000页)
            // - pdf-text: 适用于结构清晰、文本内容明确的PDF (免费)
            // - native: 仅用于原生支持文件输入的模型（按输入token计费）
            
            // 只有在非auto模式下才添加plugins参数
            // auto模式让OpenRouter自动选择（优先native，然后mistral-ocr）
            if (pdfEngine !== 'auto') {
              requestBody.plugins = [
                {
                  id: 'file-parser',
                  pdf: {
                    engine: pdfEngine
                  }
                }
              ];
            }
          }
          
          const response = await fetch(`${apiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
          }
          
          thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>`;
          let aiResponse = '';
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder('utf-8');
          
          if (!reader) {
            throw new Error('No response body reader available');
          }
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    aiResponse += content;
                    thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${aiResponse.replace(/\n/g, '<br>')}`;
                    if (chatHistory) {
                      chatHistory.scrollTop = chatHistory.scrollHeight;
                    }
                  }
                } catch (e) {
                  continue;
                }
              }
            }
          }
          
          if (aiResponse) {
            dialogData.history.push({ role: 'assistant', content: aiResponse });
          } else {
            thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${L('noResponse')}`;
          }
          
        } catch (error) {
          thinkingMsg.innerHTML = `<strong>${L('aiLabel')}</strong>${L('errorPrefix')}: ${error instanceof Error ? error.message : 'Unknown'}`;
        }
      };
      
      // Mode switch event listeners
      effectiveModeFulltext?.addEventListener('click', () => {
        if (effectiveModeFulltext) {
          effectiveModeFulltext.classList.add('active');
          effectiveModeFulltext.style.background = '#4caf50';
          effectiveModeFulltext.style.color = 'white';
          effectiveModeFulltext.style.borderColor = '#4caf50';
          effectiveModeFulltext.style.fontWeight = '500';
          effectiveModeFulltext.style.display = 'flex';
          effectiveModeFulltext.style.alignItems = 'center';
          effectiveModeFulltext.style.justifyContent = 'center';
        }
        if (effectiveModePdffile) {
          effectiveModePdffile.classList.remove('active');
          effectiveModePdffile.style.background = 'var(--color-background-secondary)';
          effectiveModePdffile.style.color = 'var(--color-text-primary)';
          effectiveModePdffile.style.borderColor = 'var(--color-border)';
          effectiveModePdffile.style.fontWeight = 'normal';
          effectiveModePdffile.style.display = 'flex';
          effectiveModePdffile.style.alignItems = 'center';
          effectiveModePdffile.style.justifyContent = 'center';
        }
      });
      
      effectiveModePdffile?.addEventListener('click', () => {
        if (effectiveModePdffile) {
          effectiveModePdffile.classList.add('active');
          effectiveModePdffile.style.background = '#4caf50';
          effectiveModePdffile.style.color = 'white';
          effectiveModePdffile.style.borderColor = '#4caf50';
          effectiveModePdffile.style.fontWeight = '500';
          effectiveModePdffile.style.display = 'flex';
          effectiveModePdffile.style.alignItems = 'center';
          effectiveModePdffile.style.justifyContent = 'center';
        }
        if (effectiveModeFulltext) {
          effectiveModeFulltext.classList.remove('active');
          effectiveModeFulltext.style.background = 'var(--color-background-secondary)';
          effectiveModeFulltext.style.color = 'var(--color-text-primary)';
          effectiveModeFulltext.style.borderColor = 'var(--color-border)';
          effectiveModeFulltext.style.fontWeight = 'normal';
          effectiveModeFulltext.style.display = 'flex';
          effectiveModeFulltext.style.alignItems = 'center';
          effectiveModeFulltext.style.justifyContent = 'center';
        }
      });
      
      effectiveSendBtn?.addEventListener('click', sendMessage);
      input?.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          sendMessage();
        }
      });
      
      effectiveClearAllBtn?.addEventListener('click', () => {
        dialogData.history = [];
        if (chatHistory) chatHistory.innerHTML = '';
        dialogData.firstQuestionSent = false;
      });
    },
    unloadCallback: () => {
      // Cleanup on close
    }
  };
  
  const dialog = new ztoolkit.Dialog(1, 1)
    .addCell(0, 0, {
      tag: 'div',
      properties: { innerHTML: dialogHTML }
    })
    .setDialogData(dialogData)
    .open(L('title'), { resizable: true, centerscreen: true, width: 700, height: 550 });
  
  if (dialog.window) {
    try {
      dialog.window.document.documentElement.style.minWidth = '500px';
      dialog.window.document.documentElement.style.minHeight = '400px';
    } catch (e) { /* ignore */ }
  }
}

export class HelperExampleFactory {
  @example
  static async dialogExample() {
    const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
    var pTitle = '';
    var pTitleH = '';
    for (var i in items) {

      var url = 'https://dblp.uni-trier.de/search/publ/api?q=' + items[i].getField("title") + '&format=bib'
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      } else {

        var data = await response.text();
        pTitle += '' + items[i].getField("title") + '\n\n';
        pTitleH += '' + data + '<br>';

      }

    }
    const dialogData: { [key: string | number]: any } = {
      inputValue: "test",
      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      },
    };
    const dialogHelper = new ztoolkit.Dialog(2, 1)
      .addCell(0, 0, {
        tag: "p",
        properties: {
          innerHTML:
            `${pTitleH}`,
        },
        styles: {
          width: "440px",
          fontSize: "12",
        },
      })
      .addCell(
        1,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners:
            [
              {
                type: "click",
                listener: (e: Event) => {
                  new ztoolkit.Clipboard()
                    .addText(
                      `${pTitle}`,
                      "text/unicode",
                    )
                    .copy();
                  ztoolkit.getGlobal("alert")("Copied!");
                },
              },
            ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "Copy",
              },
            },
          ],
        },
        false,
      )
      .addButton("Cancel", "cancel")
      .setDialogData(dialogData)
      .open("Papers");

    addon.data.dialog = dialogHelper;
    await dialogData.unloadLock.promise;
    addon.data.dialog = undefined;

    ztoolkit.log(dialogData);
  }

  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
        "text/unicode",
      )
      .addText(
        '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
        "text/html",
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"],
      ],
      "image.png",
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
