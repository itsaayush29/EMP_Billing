class FourLineSummaryReporter {
  onBegin(_, suite) {
    this.startTime = Date.now();
    this.suite = suite;
    this.totalTests = suite.allTests().length;
    this.fileNames = [...new Set(suite.allTests().map((test) => test.location?.file).filter(Boolean))];
  }

  onEnd(result) {
    const durationMs = Date.now() - this.startTime;
    const counts = { passed: 0, failed: 0, skipped: 0, timedOut: 0, interrupted: 0, flaky: 0 };
    const outcomeMap = {
      expected: 'passed',
      unexpected: 'failed',
      skipped: 'skipped',
      flaky: 'flaky',
    };

    for (const test of this.suite.allTests()) {
      const mappedOutcome = outcomeMap[test.outcome()] ?? 'failed';
      counts[mappedOutcome] += 1;

      for (const resultEntry of test.results ?? []) {
        if (resultEntry.status === 'timedOut') {
          counts.timedOut += 1;
        }
        if (resultEntry.status === 'interrupted') {
          counts.interrupted += 1;
        }
      }
    }

    const executedCount = counts.passed + counts.failed + counts.flaky + counts.timedOut + counts.interrupted;
    const filesPreview = this.fileNames.length
      ? this.fileNames.slice(0, 3).join(', ') + (this.fileNames.length > 3 ? ', ...' : '')
      : 'no test files discovered';
    const overallLabel = executedCount === 0
      ? 'NO TESTS EXECUTED'
      : result.status.toUpperCase();
    const overallNote = executedCount === 0
      ? ' (check the file path, testMatch filters, project selection, and setup dependencies)'
      : result.status === 'passed'
        ? ' (screenshots included in the localhost HTML report)'
        : ' (see localhost HTML report for screenshots and failure details)';

    console.log(`Summary 1/4: Discovered ${this.totalTests} test(s) across ${this.fileNames.length} file(s); executed ${executedCount}: ${filesPreview}`);
    console.log(`Summary 2/4: Result counts -> passed: ${counts.passed}, failed: ${counts.failed}, flaky: ${counts.flaky}, skipped: ${counts.skipped}`);
    console.log(`Summary 3/4: Additional outcomes -> timed out: ${counts.timedOut}, interrupted: ${counts.interrupted}, duration: ${(durationMs / 1000).toFixed(2)}s`);
    console.log(`Summary 4/4: Overall result -> ${overallLabel}${overallNote}`);
  }
}

export default FourLineSummaryReporter;
