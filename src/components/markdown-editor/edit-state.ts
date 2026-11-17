type EditStateEntry = { getText: () => string };

const entries = new Map<string, EditStateEntry>();

export const registerEditState = (key: string, getText: () => string) => {
  const entry: EditStateEntry = { getText };
  entries.set(key, entry);
  return () => {
    if (entries.get(key) !== entry) return;
    const text = getText();
    entries.set(key, { getText: () => text });
  };
};

export const readEditState = (key: string) => entries.get(key)?.getText();

export const clearEditState = (key: string) => {
  entries.delete(key);
};
