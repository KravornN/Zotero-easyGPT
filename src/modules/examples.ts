import { config } from "../../package.json";
import { getLocaleID, getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { cleanPdfText } from "../utils/cleanPdfText";

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

    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: getString("menuitem-label"),
      commandListener: (ev) => addon.hooks.onDialogEvents("dialogExample"),
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
      bodyXHTML: `<html:div style="display: flex; flex-direction: column; padding: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; box-sizing: border-box; height: 100%; font-size: 12px; color: var(--color-text-primary);">
        <html:div style="display: flex; flex-direction: row; gap: 4px; margin-bottom: 8px; width: 100%;">
          <html:button id="add_selection_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Add Selection</html:span>
          </html:button>
          <html:button id="add_fulltext_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Add Full Text</html:span>
          </html:button>
          <html:button id="clear_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Clear</html:span>
          </html:button>
        </html:div>
        <html:textarea id="pdftext" style="width: 100%; box-sizing: border-box; min-height: 80px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="PDF内容区（可插入全文或选中内容）"></html:textarea>
        <html:textarea id="userquery" style="width: 100%; box-sizing: border-box; min-height: 48px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="请输入你的问题..."></html:textarea>
        <html:div style="display: flex; margin-bottom: 8px; width: 100%; gap: 4px;">
          <html:button id="uquery_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Ask AI</html:span>
          </html:button>
          <html:button id="summarize_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Summarize</html:span>
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
    });
  }

  @example
  static async registerReaderItemPaneSection(win: Window) {
    const doc = win.document;
    Zotero.ItemPaneManager.registerSection({
      paneID: "reader-example",
      pluginID: config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example2-head-text"),
        // Optional
        l10nArgs: `{"status": "Initialized"}`,
        // Can also have a optional dark icon 
        icon: `chrome://${config.addonRef}/content/icons/openai@0.4x.png`,
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/openai@0.5x.png`,
      },
      // Optional
      bodyXHTML: `<html:div style="display: flex; flex-direction: column; padding: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; box-sizing: border-box; height: 100%; font-size: 12px; color: var(--color-text-primary);">
        <html:div style="display: flex; flex-direction: row; gap: 4px; margin-bottom: 8px; width: 100%;">
          <html:button id="add_selection_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Add Selection</html:span>
          </html:button>
          <html:button id="add_fulltext_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Add Full Text</html:span>
          </html:button>
          <html:button id="clear_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Clear</html:span>
          </html:button>
        </html:div>
        <html:textarea id="uquery" style="width: 100%; box-sizing: border-box; flex-grow: 1; min-height: 120px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="Enter your query here..."></html:textarea>
        <html:div style="display: flex; margin-bottom: 8px; width: 100%; gap: 4px;">
          <html:button id="uquery_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Ask AI</html:span>
          </html:button>
          <html:button id="summarize_btn" style="flex-grow: 1; padding: 4px 8px; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; font-size: 14px; color: var(--color-text-primary);">
            <html:span>Summarize</html:span>
          </html:button>
        </html:div>
        <html:textarea id="result" style="width: 100%; box-sizing: border-box; flex-grow: 2; min-height: 200px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: var(--color-background-primary); color: var(--color-text-primary); word-wrap: break-word;" placeholder="AI response will appear here..."></html:textarea>
      </html:div>`,
      // Optional, Called when the section is first created, must be synchronous
      onInit: ({ item }) => {
        ztoolkit.log("Section init!", item?.id);
      },
      // Optional, Called when the section is destroyed, must be synchronous
      onDestroy: (props) => {
        ztoolkit.log("Section destroy!");
      },
      // Optional, Called when the section data changes (setting item/mode/tabType/inTrash), must be synchronous. return false to cancel the change
      onItemChange: ({ item, setEnabled, tabType }) => {
        ztoolkit.log(`Section item data changed to ${item?.id}`);
        setEnabled(tabType === "reader");
        return true;
      },

      onRender: ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {

      },

      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {


        const uquery = body.querySelector("#uquery") as HTMLTextAreaElement;
        const uquery_btn = body.querySelector("#uquery_btn") as HTMLElement;
        const clear_btn = body.querySelector("#clear_btn") as HTMLElement;
        const add_selection_btn = body.querySelector("#add_selection_btn") as HTMLElement;
        const add_fulltext_btn = body.querySelector("#add_fulltext_btn") as HTMLElement;
        const result_p = body.querySelector("#result") as HTMLElement;
        const summarize_btn = body.querySelector("#summarize_btn") as HTMLElement;

        // Add hover effects to buttons
        const buttons = body.querySelectorAll("button");
        buttons.forEach(button => {
          button.addEventListener("mouseover", () => {
            // 亮色模式下稍微变暗，暗色模式下稍微变亮
            if (window.document.documentElement.getAttribute('theme') === 'dark') {
              button.style.backgroundColor = "var(--color-state-hover-dark)";
            } else {
              button.style.backgroundColor = "var(--color-state-hover)";
            }
          });
          button.addEventListener("mouseout", () => {
            // 恢复原来的背景色
            button.style.backgroundColor = "var(--color-background-secondary)";
          });
        });

        function clear_content() {
          uquery.value = '';
          result_p.textContent = 'Content cleared.';
        }

        // 添加一个存储最近选中文本的变量
        let lastSelectedText = '';
        let textSelectionListenerRegistered = false;

        // 改进后的Reader事件监听器，获取选中的文本
        function registerTextSelectionListener() {
          // 如果已经注册了，不要重复注册
          if (textSelectionListenerRegistered) {
            return;
          }

          // 监听renderTextSelectionPopup事件 - 这是在PDF中选择文本时触发的事件
          try {
            Zotero.Reader.registerEventListener('renderTextSelectionPopup', (event: any) => {
              // 从事件参数中获取选中的文本 - 只捕获文本而不修改弹窗
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

        // 在页面初始化时注册监听器
        registerTextSelectionListener();

        // 简化的add_selection函数，使用存储的选中文本
        async function add_selection() {
          try {
            result_p.textContent = 'Getting selection...';
            
            // 首先尝试使用我们已经捕获的最后选择的文本
            if (lastSelectedText) {
              uquery.value += lastSelectedText + '\n\n';
              result_p.textContent = 'Selected text added successfully!';
              return;
            }
            
            // 获取当前活动的Reader标签页
            const currentTabID = Zotero.Reader.getTabIDFromElement(window.document.activeElement);
            if (!currentTabID) {
              result_p.textContent = 'No active PDF reader found. Please open a PDF and select some text.';
              return;
            }
            
            // 获取Reader实例
            const reader = Zotero.Reader.getByTabID(currentTabID);
            if (!reader) {
              result_p.textContent = 'Cannot access the current PDF reader.';
              return;
            }
            
            // 尝试获取选中的文本（简化版本）
            try {
              // 尝试访问reader._iframe以直接获取选中的文本
              if (reader._iframe && reader._iframe.contentWindow) {
                const win = reader._iframe.contentWindow;
                const selection = win.getSelection();
                if (selection && selection.toString().trim()) {
                  const selectedText = selection.toString().trim();
                  uquery.value += selectedText + '\n\n';
                  result_p.textContent = 'Selected text added successfully!';
                  return;
                }
              }
            } catch (e) {
              ztoolkit.log("Failed to get selection:", e);
            }
            
            // 如果无法获取文本，提供更简单的指导
            result_p.textContent = 'Could not retrieve selected text. Please select text in PDF first, then click "Add Selection" button.';
            
          } catch (error) {
            ztoolkit.log("Error in add_selection:", error);
            result_p.textContent = 'Error getting selected text. Please try copying and pasting manually.';
          }
        }

        async function add_fulltext() {
          try {
            // Show loading message
            result_p.textContent = 'Extracting full text from PDF...';
            
            // Get the full text of the PDF
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
              // 优化PDF文本格式
              const cleanedText = cleanPdfText(pdfText);
              uquery.value += cleanedText + '\n\n';
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
          // 获取按钮内的span元素
          const btnSpan = uquery_btn.querySelector("span");
          if (btnSpan) {
            btnSpan.textContent = "Processing...";
          }
          // 使用--color-state-active变量替代固定颜色
          uquery_btn.style.backgroundColor = "var(--color-state-active)";
          
          const OPENAI_API_KEY = getPref('input') as string;
          const apiUrl = getPref('base') as string;
          const model = getPref('model') as string;

          var user_qtxt = uquery.value;
          
          // Use default research assistant prompt
          var system_prompt = '请你扮演一位学术助手，根据提供的论文内容，使用中文回答我的问题。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)"; // 恢复默认颜色
            return;
          }

          var requestData = {
            model: `${model}`,
            messages: [{ role: 'system', content: `${system_prompt}` }, { role: 'user', content: `${user_qtxt}` }],
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
                      const data = JSON.parse(line);
                      if (data.choices && data.choices[0]) {
                        const text = data.choices[0].delta?.content || '';
                        result_p.textContent += text;
                      }
                    } catch (error) {
                      ztoolkit.log("Could not parse JSON:", line);
                    }
                  }
                }
              }
            }
          } catch (error) {
            ztoolkit.log("Error", error);
            result_p.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          } finally {
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)"; // 恢复默认颜色
          }
        }

        // Add summarize function
        async function summarize_text() {
          // 获取按钮内的span元素
          const btnSpan = summarize_btn.querySelector("span");
          if (btnSpan) {
            btnSpan.textContent = "Processing...";
          }
          // 使用--color-state-active变量替代固定颜色
          summarize_btn.style.backgroundColor = "var(--color-state-active)";
          
          const OPENAI_API_KEY = getPref('input') as string;
          const apiUrl = getPref('base') as string;
          const model = getPref('model') as string;

          var user_qtxt = uquery.value;
          
          // Use summarize prompt in Chinese
          var system_prompt = '请你扮演一位学术助手，阅读以下论文内容，并用简洁、清晰的中文总结其核心要点，适合快速理解重点。请仅保留关键信息，避免冗长解释。同时不使用Markdown格式，保持纯文本输出。';

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)"; // 恢复默认颜色
            return;
          }

          if (!user_qtxt.trim()) {
            result_p.textContent = 'Please enter some text to summarize.';
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)"; // 恢复默认颜色
            return;
          }

            var requestData = {
            model: model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: system_prompt },
              { role: 'user', content: user_qtxt }
            ],
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
                        const data = JSON.parse(line);
                        if (data.choices && data.choices[0]) {
                          const text = data.choices[0].delta?.content || '';
                          result_p.textContent += text;
                        }
                      } catch (error) {
                        ztoolkit.log("Could not parse JSON:", line);
                    }
                  }
                }
              }
            }
          } catch (error) {
            ztoolkit.log("Error", error);
            result_p.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          } finally {
            if (btnSpan) {
              btnSpan.textContent = "Summarize";
            }
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)"; // 恢复默认颜色
          }
        }

        uquery_btn.addEventListener('click', ask_question);
        summarize_btn.addEventListener('click', summarize_text);
      },
      // Optional, Called when the section is toggled. Can happen anytime even if the section is not visible or not rendered
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },
    });
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
          listeners: [
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
