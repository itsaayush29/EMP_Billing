import fs from 'node:fs/promises';
import path from 'node:path';

export async function captureFailure(driver, prefix) {
  try {
    const screenshot = await driver.takeScreenshot();
    const outputPath = `test-results/${prefix}-${Date.now()}.png`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, screenshot, 'base64');
  } catch {
    // Ignore screenshot failures after teardown.
  }
}
