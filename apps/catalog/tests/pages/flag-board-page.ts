import { expect, type Locator, type Page } from '@playwright/test';

/** Flag present on every fresh load of the board. */
export const SEEDED_FLAG = 'new-checkout';

/** Page object for the Feature Flags board (/). */
export class FlagBoardPage {
  readonly heading: Locator;
  readonly input: Locator;
  readonly addButton: Locator;
  readonly items: Locator;
  readonly summary: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Feature Flags' });
    this.input = page.getByRole('textbox', { name: 'Flag Name' });
    this.addButton = page.getByRole('button', { name: 'Add Flag' });
    this.items = page.getByRole('listitem');
    this.summary = page.getByLabel('Enabled summary');
  }

  async goto() {
    await this.page.goto('/');
  }

  async addFlag(name: string) {
    await this.input.fill(name);
    await this.addButton.click();
  }

  toggleButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Toggle ${name}`, exact: true });
  }

  removeButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${name}`, exact: true });
  }

  async expectFlags(names: string[]) {
    await expect(this.items).toHaveCount(names.length);
    for (const [i, name] of names.entries()) {
      await expect(this.items.nth(i)).toContainText(name);
    }
  }
}
