import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./app.css";
import "bootstrap-icons/font/bootstrap-icons.css";

/* ---------- STRATA LANGUAGE ---------- */
monaco.languages.register({ id: "strata" });
monaco.languages.setMonarchTokensProvider("strata", {
  tokenizer: {
    root: [
      [/\b(func|return|if|else|while|for|print)\b/, "keyword"],
      [/"[^"]*"/, "string"],
      [/\b\d+\b/, "number"],
      [/[a-zA-Z_]\w*/, "identifier"],
    ],
  },
});

/* ---------- MONACO SUPPORTED LANGUAGES ---------- */
const monacoLanguages = {
  ".ts": "typescript",
  ".js": "javascript",
  ".css": "css",
  ".less": "less",
  ".scss": "scss",
  ".json": "json",
  ".html": "html",
  ".xml": "xml",
  ".php": "php",
  ".cs": "csharp",
  ".cpp": "cpp",
  ".c": "cpp",
  ".h": "cpp",
  ".razor": "razor",
  ".md": "markdown",
  ".diff": "diff",
  ".java": "java",
  ".vb": "vb",
  ".coffee": "coffeescript",
  ".handlebars": "handlebars",
  ".bat": "bat",
  ".pug": "pug",
  ".fs": "fsharp",
  ".lua": "lua",
  ".ps1": "powershell",
  ".py": "python",
  ".rb": "ruby",
  ".sass": "sass",
  ".r": "r",
  ".m": "objective-c",
  ".str": "strata",
};

/* ---------- FILE ICONS (Nerd Fonts) ---------- */
const fileIcons = {
  ".js": "nf nf-dev-javascript",
  ".ts": "nf nf-dev-typescript",
  ".py": "nf nf-dev-python",
  ".html": "nf nf-dev-html5",
  ".css": "nf nf-dev-css3",
  ".json": "nf nf-mdi-json",
  ".md": "nf nf-oct-markdown",
  ".str": "nf nf-mdi-language",
  ".cpp": "nf nf-dev-cplusplus",
  ".c": "nf nf-dev-cplusplus",
  ".h": "nf nf-dev-cplusplus",
  ".cs": "nf nf-dev-csharp",
  ".java": "nf nf-dev-java",
  ".rb": "nf nf-dev-ruby",
  ".php": "nf nf-dev-php",
  ".lua": "nf nf-dev-lua",
  ".bat": "nf nf-mdi-console",
  ".ps1": "nf nf-mdi-terminal",
  ".pug": "nf nf-dev-pug",
  ".sass": "nf nf-dev-sass",
  ".r": "nf nf-dev-r",
  ".m": "nf nf-dev-apple",
};

/* ---------- LANGUAGE DETECTION ---------- */
export function getLanguage(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return monacoLanguages[ext] || "plaintext";
}

/* ---------- FILE/FOLDER HELPERS ---------- */
function createFolder(name, open = false) {
  return { name, type: "folder", children: [], open };
}

function createFile(name, content = "") {
  return { name, type: "file", content };
}

export default function App() {
  const [filesData, setFilesData] = useState([
    createFolder("src"),
    createFile("WELCOME.txt", `WELOME TO STRATA! {\n  This is another line.\n}`),
  ]);
  const [tabs, setTabs] = useState([]);
  const [activeFile, setActiveFile] = useState("");
  const [filesContent, setFilesContent] = useState({
    "main.str": `Welcome to !{\n  This is another line.\n}`,
  });
  const [output, setOutput] = useState("");

  /* ---------- KEYBOARD SHORTCUTS ---------- */
  useEffect(() => {
    function handleKey(e) {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            addNewFile();
            break;
          case "f":
            e.preventDefault();
            addNewFolder();
            break;
          case "r":
            e.preventDefault();
            runCode();
            break;
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  /* ---------- FILE EXPLORER ---------- */
  function toggleFolder(node) {
    node.open = !node.open;
    setFilesData([...filesData]);
  }

  function handleFileClick(name) {
    if (!tabs.includes(name)) setTabs([...tabs, name]);
    setActiveFile(name);
  }

  function updateFileContent(name, content) {
    setFilesContent({ ...filesContent, [name]: content });
  }

  function addNewFile() {
    const name = prompt("Enter new file name (with extension):");
    if (!name) return;
    if (filesContent[name]) {
      alert("File already exists!");
      return;
    }
    setFilesContent({ ...filesContent, [name]: "" });
    handleFileClick(name);
    setFilesData((prev) => [...prev, createFile(name)]);
  }

  function addNewFolder() {
    const name = prompt("Enter new folder name:");
    if (!name) return;
    setFilesData((prev) => [...prev, createFolder(name)]);
  }

  function renderExplorer(nodes, indent = 0) {
    return nodes.map((node) => {
      if (node.type === "folder") {
        return (
          <div key={node.name} style={{ paddingLeft: indent * 16 }} className="folder">
            <div className="folder-label" onClick={() => toggleFolder(node)}>
              <i className={`bi ${node.open ? "bi-caret-down-fill" : "bi-caret-right-fill"}`}></i>
              <i className="bi bi-folder"></i> {node.name}
            </div>
            {node.open && node.children && renderExplorer(node.children, indent + 1)}
          </div>
        );
      } else {
        const ext = node.name.slice(node.name.lastIndexOf("."));
        return (
          <div
            key={node.name}
            style={{ paddingLeft: indent * 16 }}
            className="file"
            onClick={() => handleFileClick(node.name)}
          >
            <i className={fileIcons[ext] || "bi bi-file-earmark"}></i> {node.name}
          </div>
        );
      }
    });
  }

  /* ---------- RUN CODE ---------- */
  function runCode() {
    if (!activeFile) return;
    try {
      let code = filesContent[activeFile];
      if (activeFile.endsWith(".str")) code = code.replace(/print\(/g, "console.log(");
      const logs = [];
      const fakeConsole = { log: (...a) => logs.push(a.join(" ")) };
      new Function("console", code)(fakeConsole);
      setOutput(logs.join("\n"));
    } catch (e) {
      setOutput(e.toString());
    }
  }

  return (
    <div className="ide">
      {/* ---------- TOP MENU ---------- */}
      <div className="top-menu">
        {["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
          <div key={item} className="menu-item">
            {item}
            <div className="dropdown">
              {item === "File" && (
                <>
                  <div className="dropdown-item" onClick={addNewFile}>New File (Ctrl+N)</div>
                  <div className="dropdown-item" onClick={addNewFolder}>New Folder (Ctrl+F)</div>
                </>
              )}
              {item === "Run" && <div className="dropdown-item" onClick={runCode}>Run (Ctrl+R)</div>}
              {item === "Edit" && (
                <>
                  <div className="dropdown-item">Undo (Ctrl+Z)</div>
                  <div className="dropdown-item">Redo (Ctrl+Y)</div>
                  <div className="dropdown-item">Cut (Ctrl+X)</div>
                  <div className="dropdown-item">Copy (Ctrl+C)</div>
                  <div className="dropdown-item">Paste (Ctrl+V)</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="main-container">
        {/* ---------- LEFT SIDEBAR ---------- */}
        <div className="left-sidebar">
          <i className="bi bi-folder" title="Explorer"></i>
          <i className="bi bi-git" title="Version Control"></i>
          <i className="bi bi-code-slash" title="Extensions"></i>
          <i className="bi bi-gear" title="Settings"></i>
        </div>

        {/* ---------- FILE EXPLORER ---------- */}
        <div className="sidebar">
          <div className="sidebar-actions">
            <i className="bi bi-file-plus" title="Add File" onClick={addNewFile}></i>
            <i className="bi bi-folder-plus" title="Add Folder" onClick={addNewFolder}></i>
          </div>
          <div className="file-tree">{renderExplorer(filesData)}</div>
        </div>

        {/* ---------- EDITOR ---------- */}
        <div className="main">
          <div className="tabs">
            {tabs.map((file) => (
              <div
                key={file}
                className={`tab ${file === activeFile ? "active" : ""}`}
                onClick={() => setActiveFile(file)}
              >
                {file}
                <span
                  className="close"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = tabs.filter((t) => t !== file);
                    setTabs(next);
                    if (activeFile === file) setActiveFile(next[0] || "");
                  }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>

          {activeFile ? (
            <div className="editor-wrapper">
              <Editor
                value={filesContent[activeFile]}
                language={getLanguage(activeFile)}
                theme="vs-dark"
                onChange={(v) => updateFileContent(activeFile, v)}
                options={{
                  automaticLayout: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                }}
              />
            </div>
          ) : (
            <div className="empty-editor">Select a file to start editing</div>
          )}

          <pre className="console">{output}</pre>
        </div>
      </div>
    </div>
  );
}
