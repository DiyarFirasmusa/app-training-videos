import { defineVideo } from './define.ts';

/**
 * Replace this with the first real video. Titles: at most 6 words. Text: at most two short lines.
 * Every step needs a target (a locator) except the welcome step. See ../AUTHORING.md.
 */
export default defineVideo({
  id: '01-example',
  number: 1,
  title: 'Add your first item',
  chapter: 'Getting started',
  subtitle: 'Create an item and find it in the list',
  role: 'none',
  startPath: '/',
  learn: ['Open the form', 'Fill the name', 'Save and see it in the list'],
  steps: [
    { title: 'Welcome', text: 'In this video you add an item and see it in the list.' },
    { title: 'Type the item name', text: 'Use a clear name that others will recognise.', tip: 'Short names read better in tables.', target: (p) => p.getByLabel('Name'), act: { fill: 'Office chair' }, side: 'bottom' },
    { title: 'Press “Add item”', text: 'The item is saved and shown below.', target: (p) => p.getByRole('button', { name: 'Add item' }), side: 'bottom' },
    { title: 'Here is the new item', text: 'It now appears in the list.', target: (p) => p.getByText('Office chair'), act: 'none', side: 'bottom' },
  ],
});
