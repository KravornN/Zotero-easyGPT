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
        <html:textarea id="pdftext" style="width: 100%; box-sizing: border-box; min-height: 80px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="PDF Content Area (Insert full or selected text)"></html:textarea>
        <html:textarea id="userquery" style="width: 100%; box-sizing: border-box; min-height: 48px; padding: 6px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 2px; margin-bottom: 8px; resize: vertical; font-family: inherit; background-color: var(--color-background-primary); color: var(--color-text-primary);" placeholder="Please enter your question..."></html:textarea>
        <html:div style="display: flex; margin-bottom: 8px; width: 100%; gap: 4px;">
          <html:button id="associate_btn" title="联想" style="width: 36px; padding: 4px 0; background-color: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <html:span style="display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9851 4.00291C11.9933 4.00046 11.9982 4.00006 11.9996 4C12.001 4.00006 12.0067 4.00046 12.0149 4.00291C12.0256 4.00615 12.047 4.01416 12.079 4.03356C12.2092 4.11248 12.4258 4.32444 12.675 4.77696C12.9161 5.21453 13.1479 5.8046 13.3486 6.53263C13.6852 7.75315 13.9156 9.29169 13.981 11H10.019C10.0844 9.29169 10.3148 7.75315 10.6514 6.53263C10.8521 5.8046 11.0839 5.21453 11.325 4.77696C11.5742 4.32444 11.7908 4.11248 11.921 4.03356C11.953 4.01416 11.9744 4.00615 11.9851 4.00291ZM8.01766 11C8.08396 9.13314 8.33431 7.41167 8.72334 6.00094C8.87366 5.45584 9.04762 4.94639 9.24523 4.48694C6.48462 5.49946 4.43722 7.9901 4.06189 11H8.01766ZM4.06189 13H8.01766C8.09487 15.1737 8.42177 17.1555 8.93 18.6802C9.02641 18.9694 9.13134 19.2483 9.24522 19.5131C6.48461 18.5005 4.43722 16.0099 4.06189 13ZM10.019 13H13.981C13.9045 14.9972 13.6027 16.7574 13.1726 18.0477C12.9206 18.8038 12.6425 19.3436 12.3823 19.6737C12.2545 19.8359 12.1506 19.9225 12.0814 19.9649C12.0485 19.9852 12.0264 19.9935 12.0153 19.9969C12.0049 20.0001 11.9999 20 11.9999 20C11.9999 20 11.9948 20 11.9847 19.9969C11.9736 19.9935 11.9515 19.9852 11.9186 19.9649C11.8494 19.9225 11.7455 19.8359 11.6177 19.6737C11.3575 19.3436 11.0794 18.8038 10.8274 18.0477C10.3973 16.7574 10.0955 14.9972 10.019 13ZM15.9823 13C15.9051 15.1737 15.5782 17.1555 15.07 18.6802C14.9736 18.9694 14.8687 19.2483 14.7548 19.5131C17.5154 18.5005 19.5628 16.0099 19.9381 13H15.9823ZM19.9381 11C19.5628 7.99009 17.5154 5.49946 14.7548 4.48694C14.9524 4.94639 15.1263 5.45584 15.2767 6.00094C15.6657 7.41167 15.916 9.13314 15.9823 11H19.9381Z" fill="currentColor"></path></svg>
            </html:span>
          </html:button>
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
      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        const lang = getPref('lang') as string || 'zh-CN';
        const pdftext = body.querySelector("#pdftext") as HTMLTextAreaElement;
        const userquery = body.querySelector("#userquery") as HTMLTextAreaElement;
        const result_p = body.querySelector("#result") as HTMLTextAreaElement;
        const uquery_btn = body.querySelector("#uquery_btn") as HTMLElement;
        const summarize_btn = body.querySelector("#summarize_btn") as HTMLElement;
        const clear_btn = body.querySelector("#clear_btn") as HTMLElement;
        const add_selection_btn = body.querySelector("#add_selection_btn") as HTMLElement;
        const add_fulltext_btn = body.querySelector("#add_fulltext_btn") as HTMLElement;
        const associate_btn = body.querySelector("#associate_btn") as HTMLElement;

        if (associate_btn) {
            associate_btn.setAttribute('title', getString('associate-button-tooltip'));
        }

        let associateActive = false;
        associate_btn.addEventListener("click", () => {
          associateActive = !associateActive;
          if (associateActive) {
            associate_btn.style.backgroundColor = "#1976d2";
            associate_btn.style.borderColor = "#1976d2"; // Active state: blue border
          } else {
            associate_btn.style.backgroundColor = "var(--color-background-secondary)";
            associate_btn.style.borderColor = "var(--color-border)"; // Inactive state: default border
          }
        });

        // 设置AI输出框为只读
        if (result_p) {
          result_p.readOnly = true;
        }

        // Add hover effects to buttons
        const buttons = body.querySelectorAll("button");
        buttons.forEach(button => {
          button.addEventListener("mouseover", () => {
            if (window.document.documentElement.getAttribute('theme') === 'dark') {
              button.style.backgroundColor = "var(--color-state-hover-dark)";
            } else {
              button.style.backgroundColor = "var(--color-state-hover)";
            }
          });
          button.addEventListener("mouseout", () => {
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

        // 更强的PSE搜索，支持分页和过滤
        // 返回结构化结果 {link, title, snippet}
        type PseResult = { link: string; title?: string; snippet?: string };
        async function searchGooglePSE(
          apiKey: string,
          searchEngineId: string,
          query: string,
          count: number = 3,
          filterList?: string[]
        ): Promise<PseResult[]> {
          const url = "https://www.googleapis.com/customsearch/v1";
          let allResults: PseResult[] = [];
          let startIndex = 1;
          while (count > 0) {
            const numResultsThisPage = Math.min(count, 10);
            const params = new URLSearchParams({
              cx: searchEngineId,
              q: query,
              key: apiKey,
              num: numResultsThisPage.toString(),
              start: startIndex.toString(),
            });
            try {
              const res = await fetch(`${url}?${params.toString()}`);
              if (!res.ok) throw new Error(`PSE API error: ${res.status} ${res.statusText}`);
              const json: any = await res.json();
              const items = (json.items || []) as any[];
              if (!items.length) break;
              allResults.push(
                ...items.map((item: any) => ({
                  link: item.link,
                  title: item.title,
                  snippet: item.snippet,
                }))
              );
              count -= items.length;
              startIndex += 10;
            } catch (e) {
              break;
            }
          }
          if (filterList && filterList.length > 0) {
            allResults = allResults.filter(
              (item) =>
                !filterList.some((f) =>
                  (item.title || "").includes(f) ||
                  (item.snippet || "").includes(f) ||
                  (item.link || "").includes(f)
                )
            );
          }
          return allResults;
        }

        async function getKeywordsFromAbstract(abstract: string): Promise<string[]> {
          if (!abstract || abstract.trim().length < 50) {
            ztoolkit.log('[getKeywordsFromAbstract] Abstract is too short or empty.');
            return [];
          }

          const OPENAI_API_KEY = getPref('input') as string;
          const apiUrl = getPref('base') as string;
          const model = getPref('model') as string;

          if (!OPENAI_API_KEY || !apiUrl) {
            ztoolkit.log('[getKeywordsFromAbstract] OpenAI API key or base URL not set.');
            return [];
          }

          const system_prompt = `You are an academic research assistant. Based on the provided abstract, please generate 3 to 5 generalized English keywords that would be effective for a literature search to find related papers. The keywords should capture the main topics and concepts but be broad enough to discover a range of relevant studies. Please output *only* the keywords, separated by commas, without any other text or numbering.`;

          const requestData = {
            model: model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: system_prompt },
              { role: 'user', content: abstract }
            ],
            temperature: 0.5,
            max_tokens: 50,
            stream: false
          };

          try {
            const response = await fetch(`${apiUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });

            if (!response.ok) {
              const errorText = await response.text();
              ztoolkit.log(`[getKeywordsFromAbstract] OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
              return [];
            }

            const data: any = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
              const keywordsString = data.choices[0].message.content.trim();
              const keywords = keywordsString.split(',').map((kw: string) => kw.trim()).filter((kw: string) => kw.length > 0);
              ztoolkit.log(`[getKeywordsFromAbstract] Generated keywords: ${keywords.join(', ')}`);
              return keywords;
            } else {
              ztoolkit.log('[getKeywordsFromAbstract] OpenAI response format unexpected or content missing.');
              return [];
            }
          } catch (error: any) {
            ztoolkit.log(`[getKeywordsFromAbstract] Error calling OpenAI for keywords: ${error.message}`);
            return [];
          }
        }

        // 替换fetchAssociativeContent为新版，抓取PSE结果并用r.jina.ai获取内容
        async function fetchAssociativeContent(abstract: string): Promise<{content?: string, error?: string}> {
          const pse_id = getPref('pse_id');
          const pse_key = getPref('pse_key');
          if (!pse_id || !pse_key) return { error: 'PSE id/key not set.' };
          
          ztoolkit.log('[fetchAssociativeContent] Starting with abstract...');
          let keywords = await getKeywordsFromAbstract(abstract);
          if (!keywords.length) {
            ztoolkit.log('[fetchAssociativeContent] Failed to extract keywords from abstract.');
            return { error: 'Failed to generate keywords from abstract for associative search.' };
          }
          const query = keywords.join(' ');
          ztoolkit.log(`[fetchAssociativeContent] Keywords for PSE: "${query}"`);

          try {
            ztoolkit.log(`[fetchAssociativeContent] Calling searchGooglePSE, requesting 5 results.`);
            const pseResults = await searchGooglePSE(String(pse_key), String(pse_id), query, 5);
            ztoolkit.log(`[fetchAssociativeContent] searchGooglePSE returned ${pseResults.length} results.`);

            if (!pseResults.length) {
              ztoolkit.log('[fetchAssociativeContent] No associative results from PSE for generated keywords.');
              return { error: 'No associative results for generated keywords.' };
            }

            let contents: string[] = [];
            ztoolkit.log(`[fetchAssociativeContent] Processing ${pseResults.length} PSE results with Jina...`);
            for (let i = 0; i < pseResults.length; i++) {
              const result = pseResults[i];
              ztoolkit.log(`[fetchAssociativeContent] Jina: Processing result ${i + 1}/${pseResults.length}: ${result.link}`);
              try {
                const rurl = `https://r.jina.ai/${result.link}`;
                const jina_key = getPref('jina_key') as string;
                const headers: HeadersInit = {};
                if (jina_key && jina_key.trim() !== '') {
                  headers['Authorization'] = `Bearer ${jina_key}`;
                }
                const rres = await fetch(rurl, { headers });
                if (!rres.ok) {
                  ztoolkit.log(`[fetchAssociativeContent] Jina: Fetch failed for ${result.link} - Status: ${rres.status} ${rres.statusText}`);
                  continue; 
                }
                const rtext = await rres.text();
                const prefix = getString('retrieved-pubmed-article-prefix');
                contents.push(`${prefix}${result.title || result.link}\n${rtext}`);
                ztoolkit.log(`[fetchAssociativeContent] Jina: Fetch successful for ${result.link}`);
              } catch (e: any) {
                ztoolkit.log(`[fetchAssociativeContent] Jina: Exception during fetch for ${result.link}: ${e.message}`);
              }
            }
            ztoolkit.log(`[fetchAssociativeContent] Successfully fetched ${contents.length} Jina contents out of ${pseResults.length} PSE results.`);
            if (contents.length === 0 && pseResults.length > 0) {
              return { error: 'PSE returned results, but Jina failed to process any links.' };
            }
            return { content: contents.join('\\n\\n') };
          } catch (e: any) {
            ztoolkit.log(`[fetchAssociativeContent] Outer error in PSE/Jina processing: ${e.message}`);
            return { error: `PSE or r.jina.ai error: ${e.message}` };
          }
        }

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

          // 联想功能
          if (associateActive) {
            result_p.textContent = '正在获取联想内容 (基于摘要关键词)...';
            const abstractNote = String(item.getField ? item.getField('abstractNote') : '');
            if (!abstractNote || abstractNote.trim() === '') {
                ztoolkit.log('[ask_question] Abstract note is empty, skipping associative search.');
                result_p.textContent += '\\n摘要为空，无法提取关键词进行联想。';
            } else {
                let assoc = await fetchAssociativeContent(abstractNote);
                if (assoc && assoc.content) {
                  user_qtxt += '\\n' + assoc.content;
                  result_p.textContent = 'AI response will appear here... (联想内容已添加)'; 
                } else if (assoc && assoc.error) {
                  result_p.textContent = '联想内容获取失败: ' + assoc.error + '\\n';
                }
            }
          }

          let system_prompt = '';
          if (associateActive) {
            if (lang === 'en-US') {
              system_prompt = 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. The following includes the main paper content and may be supplemented by content from related PubMed articles retrieved through an associative search. Please synthesize all information to provide a comprehensive answer. Do not use Markdown format, keep the output as plain text.';
            } else {
              system_prompt = '请你扮演一位学术助手。请根据提供的论文内容使用中文回答我的问题。接下来的内容包括了主要论文信息，并可能补充了检索到的相关PubMed文章。请综合所有信息给出全面的回答。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
            }
          } else {
            if (lang === 'en-US') {
              system_prompt = 'You are an academic assistant. Please answer my question in clear and accurate English based on the provided paper content. Do not use Markdown format, keep the output as plain text.';
            } else {
              system_prompt = '请你扮演一位学术助手，根据提供的论文内容，使用中文回答我的问题。请确保表达清晰准确，不使用Markdown格式，保持纯文本输出。';
            }
          }

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
            if (btnSpan) {
              btnSpan.textContent = "Ask AI";
            }
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
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
            uquery_btn.style.backgroundColor = "var(--color-background-secondary)";
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

          // 联想功能
          if (associateActive) {
            result_p.textContent = '正在获取联想内容 (基于摘要关键词)...';
            const abstractNote = String(item.getField ? item.getField('abstractNote') : '');
            if (!abstractNote || abstractNote.trim() === '') {
                ztoolkit.log('[summarize_text] Abstract note is empty, skipping associative search.');
                result_p.textContent += '\\n摘要为空，无法提取关键词进行联想。';
            } else {
                let assoc = await fetchAssociativeContent(abstractNote);
                if (assoc && assoc.content) {
                  user_qtxt += '\\n' + assoc.content;
                  result_p.textContent = 'AI response will appear here... (联想内容已添加)';
                } else if (assoc && assoc.error) {
                  result_p.textContent = '联想内容获取失败: ' + assoc.error + '\\n';
                }
            }
          }

          let system_prompt = '';
          if (associateActive) {
            if (lang === 'en-US') {
              system_prompt = 'You are an academic assistant. Please read the following paper content and summarize the key points in concise and clear English for quick understanding. The following includes the main paper content and may be supplemented by content from related PubMed articles retrieved through an associative search. Please summarize the main paper and related articles separately. Only keep the essential information, avoid lengthy explanations. Do not use Markdown format, keep the output as plain text.';
            } else {
              system_prompt = '请你扮演一位学术助手。请阅读以下论文内容，并用简洁、清晰的中文总结其核心要点，适合快速理解重点。接下来的内容包括了主要论文信息，并可能补充了检索到的相关PubMed文章。请分开总结主要论文和相关文章。请仅保留关键信息，避免冗长解释。同时不使用Markdown格式，保持纯文本输出。';
            }
          } else {
            if (lang === 'en-US') {
              system_prompt = 'You are an academic assistant. Please read the following paper content and summarize the key points in concise and clear English for quick understanding. Only keep the essential information, avoid lengthy explanations. Do not use Markdown format, keep the output as plain text.';
            } else {
              system_prompt = '请你扮演一位学术助手，阅读以下论文内容，并用简洁、清晰的中文总结其核心要点，适合快速理解重点。请仅保留关键信息，避免冗长解释。同时不使用Markdown格式，保持纯文本输出。';
            }
          }

          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent = 'API key or base URL is not set. Please configure them in the settings.';
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
            summarize_btn.style.backgroundColor = "var(--color-background-secondary)";
          }
        }

        uquery_btn.addEventListener('click', ask_question);
        summarize_btn.addEventListener('click', summarize_text);
      },
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
