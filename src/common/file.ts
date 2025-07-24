export interface FileInfo {
  name: string;
  size: number;
  type: string;
}

export function getFileInfo(file: File): FileInfo {
  return {
    name: file.name,
    size: file.size,
    type: file.type
  };
}

export async function saveFile(file: File): Promise<void> {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
