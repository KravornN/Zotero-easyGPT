import { config } from "../../package.json";
import { getString } from "../utils/locale";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: "title",
          label: getString("prefs-table-title"),
          fixedWidth: true,
          width: 100,
        },
        {
          dataKey: "detail",
          label: getString("prefs-table-detail"),
        },
      ],
      rows: [
        {
          title: "Orange",
          detail: "It's juicy",
        },
        {
          title: "Banana",
          detail: "It's sweet",
        },
        {
          title: "Apple",
          detail: "I mean the fruit APPLE",
        },
      ],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          title: "no data",
          detail: "no data",
        },
    )
    // Show a progress window when selection changes
    .setProp("onSelectionChange", (selection) => {
      new ztoolkit.ProgressWindow(config.addonName)
        .createLine({
          text: `Selected line: ${addon.data.prefs?.rows
            .filter((v, i) => selection.isSelected(i))
            .map((row) => row.title)
            .join(",")}`,
          progress: 100,
        })
        .show();
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.data.prefs!.rows =
          addon.data.prefs?.rows.filter(
            (v, i) => !tableHelper.treeInstance.selection.isSelected(i),
          ) || [];
        tableHelper.render();
        return false;
      }
      return true;
    })
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].title || "",
    )
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
  // 创建一个函数用于显示提示消息，而不是使用alert
  const showNotification = (message: string) => {
    const notificationElement = addon.data.prefs!.window.document.createElement('div');
    notificationElement.textContent = message;
    notificationElement.style.cssText = 
      'position: fixed; bottom: 20px; right: 20px; background-color: #2c679f; color: white; ' +
      'padding: 10px 14px; border-radius: 3px; font-size: 13px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); ' +
      'z-index: 9999; opacity: 0; transition: opacity 0.2s ease-in-out; max-width: 250px;';
    
    addon.data.prefs!.window.document.body.appendChild(notificationElement);
    
    // 显示通知
    setTimeout(() => {
      notificationElement.style.opacity = '1';
    }, 10);
    
    // 2.5秒后删除通知
    setTimeout(() => {
      notificationElement.style.opacity = '0';
      setTimeout(() => {
        if (notificationElement.parentNode) {
          addon.data.prefs!.window.document.body.removeChild(notificationElement);
        }
      }, 200);
    }, 2500);
  };

  // API Key 输入框
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-input`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      showNotification(`API Key saved successfully!`);
    });

  // Base URL 输入框
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-base`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      showNotification(`API URL saved successfully!`);
    });
  
  // Model 输入框
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-model`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      showNotification(`Model name saved successfully!`);
    });

  // Multi-paper Model 输入框
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-multiModel`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      showNotification(`Multi-paper model name saved successfully!`);
    });

  // PDF Engine 下拉框
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-pdfEngine`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      showNotification(`PDF engine saved successfully!`);
    });
}
