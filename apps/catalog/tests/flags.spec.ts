import { test, expect, SEEDED_FLAG } from './fixtures';

test.describe('Feature flags', () => {
  test('shows the seeded flag enabled on load', async ({ flagBoard }) => {
    await flagBoard.expectFlags([SEEDED_FLAG]);
    await expect(flagBoard.toggleButton(SEEDED_FLAG)).toHaveText('On');
    await expect(flagBoard.summary).toHaveText('1 of 1 enabled');
  });

  test('adds a new flag, disabled by default', async ({ flagBoard }) => {
    await flagBoard.addFlag('dark-mode');
    await flagBoard.expectFlags([SEEDED_FLAG, 'dark-mode']);
    await expect(flagBoard.toggleButton('dark-mode')).toHaveText('Off');
    await expect(flagBoard.summary).toHaveText('1 of 2 enabled');
    await expect(flagBoard.input).toHaveValue('');
  });

  test('toggles a flag on and back off', async ({ flagBoard }) => {
    await flagBoard.addFlag('dark-mode');
    await flagBoard.toggleButton('dark-mode').click();
    await expect(flagBoard.toggleButton('dark-mode')).toHaveText('On');
    await expect(flagBoard.summary).toHaveText('2 of 2 enabled');

    await flagBoard.toggleButton('dark-mode').click();
    await expect(flagBoard.toggleButton('dark-mode')).toHaveText('Off');
    await expect(flagBoard.summary).toHaveText('1 of 2 enabled');
  });

  test('removes a flag', async ({ flagBoard }) => {
    await flagBoard.addFlag('dark-mode');
    await flagBoard.removeButton('dark-mode').click();
    await flagBoard.expectFlags([SEEDED_FLAG]);
  });

  test('ignores empty and duplicate names', async ({ flagBoard }) => {
    await flagBoard.addFlag('   ');
    await flagBoard.expectFlags([SEEDED_FLAG]);

    await flagBoard.addFlag(SEEDED_FLAG);
    await flagBoard.expectFlags([SEEDED_FLAG]);
  });
});
