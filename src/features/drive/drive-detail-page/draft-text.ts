/** Draft editor text by editor state key, kept outside React like Capy's edit state. */
const texts = new Map<string, string>();

export const draftText = (key: string) => texts.get(key);
export const setDraftText = (key: string, text: string) => {
  texts.set(key, text);
};
export const clearDraftText = (key: string) => {
  texts.delete(key);
};
