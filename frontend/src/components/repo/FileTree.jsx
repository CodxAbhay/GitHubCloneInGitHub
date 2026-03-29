import React, { useState } from "react";
import "./fileTree.css";

const FileTree = ({ tree, onFileClick }) => {

  return (
    <div className="file-tree">
      {Object.entries(tree).map(([name, node]) => (
        <TreeNode
          key={name}
          name={name}
          node={node}
          level={0}
          path={name}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );

};

const TreeNode = ({ name, node, level, path, onFileClick }) => {

  const [open, setOpen] = useState(false);

  const isFile = node.type === "file";

  const paddingLeft = level * 18;

  if (isFile) {
    return (
      <div
        className="file-node"
        style={{ paddingLeft }}
        onClick={() => onFileClick(node.url, path)}
      >
        📄 {name}
      </div>
    );
  }

  return (
    <div className="folder-node">

      <div
        className="folder-name"
        style={{ paddingLeft }}
        onClick={() => setOpen(!open)}
      >
        <span className="folder-arrow">
          {open ? "▼" : "▶"}
        </span>

        <span className="folder-icon">
          {open ? "📂" : "📁"}
        </span>

        {name}
      </div>

      {open && (
        <div className="folder-children">
          {Object.entries(node).map(([childName, childNode]) => (
            <TreeNode
              key={childName}
              name={childName}
              node={childNode}
              level={level + 1}
              path={`${path}/${childName}`}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}

    </div>
  );

};

export default FileTree;