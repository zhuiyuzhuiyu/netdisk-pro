import type { DriveItem } from '../types';

type Props = {
  folders: DriveItem[];
  currentFolderId: string | null;
  onSelect: (id: string | null) => void;
};

const buildChildren = (folders: DriveItem[], parentId: string | null) =>
  folders.filter((folder) => folder.parentId === parentId);

const FolderNode = ({
  folders,
  node,
  currentFolderId,
  onSelect
}: {
  folders: DriveItem[];
  node: DriveItem;
  currentFolderId: string | null;
  onSelect: (id: string | null) => void;
}) => {
  const children = buildChildren(folders, node.id);

  return (
    <li>
      <button
        className={`w-full rounded-lg px-2 py-1 text-left text-sm ${
          currentFolderId === node.id ? 'bg-brand-500 text-white' : 'hover:bg-brand-100'
        }`}
        onClick={() => onSelect(node.id)}
      >
        {node.name}
      </button>
      {children.length > 0 && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-slate-300 pl-2">
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folders={folders}
              node={child}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const FolderTree = ({ folders, currentFolderId, onSelect }: Props) => {
  const roots = buildChildren(folders, null);

  return (
    <aside className="rounded-2xl bg-white/70 p-4 shadow-panel backdrop-blur">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-700">Folders</h2>
      <button
        className={`mb-2 w-full rounded-lg px-2 py-1 text-left text-sm ${
          currentFolderId === null ? 'bg-brand-500 text-white' : 'hover:bg-brand-100'
        }`}
        onClick={() => onSelect(null)}
      >
        Root
      </button>
      <ul className="space-y-1">
        {roots.map((root) => (
          <FolderNode
            key={root.id}
            folders={folders}
            node={root}
            currentFolderId={currentFolderId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </aside>
  );
};
