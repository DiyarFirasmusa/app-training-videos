/** The fake data. Seed it with 20-50 realistic records per large resource (names, IDs, phones, dates) in the app's language. */
export interface Item {
  id: number;
  name: string;
}

export const db: { items: Item[] } = { items: [] };

export const resetDb = (): void => {
  db.items = [
    { id: 1, name: 'Sample item one' },
    { id: 2, name: 'Sample item two' },
  ];
};
resetDb();
