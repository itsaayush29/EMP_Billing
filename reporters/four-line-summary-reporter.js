class FourLineSummaryReporter {
  onBegin(_, suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;
    this.suite = suite;
    this.fileNames = [...new Set(suite.allTests().map((test) => test.location?.file).filter(Boolean))];
  }

  onEnd(result) {
    const durationMs = Date.now() - this.startTime;
    const counts = { passed: 0, failed: 0, skipped: 0, timedOut: 0, interrupted: 0, flaky: 0 };

    for (const test of this.suite.allTests()) {
      const outcome = test.outcome();
      counts[outcome] = (counts[outcome] || 0) + 1;
    }

    const scopeLabel = this.totalTests === 1 ? 'single test' : 'test run';
    const filesPreview = this.fileNames.length
      ? this.fileNames.slice(0, 3).join(', ') + (this.fileNames.length > 3 ? ', ...' : '')
      : 'no test files discovered';

    console.log(`Summary 1/4: Executed ${scopeLabel} with ${this.totalTests} test(s) across ${this.fileNames.length} file(s): ${filesPreview}`);
    console.log(`Summary 2/4: Result counts -> passed: ${counts.passed || 0}, failed: ${counts.failed || 0}, flaky: ${counts.flaky || 0}, skipped: ${counts.skipped || 0}`);
    console.log(`Summary 3/4: Additional outcomes -> timed out: ${counts.timedOut || 0}, interrupted: ${counts.interrupted || 0}, duration: ${(durationMs / 1000).toFixed(2)}s`);
    console.log(`Summary 4/4: Overall result -> ${result.status.toUpperCase()}${result.status === 'passed' ? ' (screenshots included in the localhost HTML report)' : ' (see localhost HTML report for screenshots and failure details)'}`);
  }
}

export default FourLineSummaryReporter;
