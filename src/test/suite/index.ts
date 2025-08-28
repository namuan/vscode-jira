import * as path from 'path';

const Mocha = require('mocha');
const glob = require('glob');

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		try {
			// Discover and add all test files under suite ending with .test.js
			const files = glob.sync('suite/**/*.test.js', { cwd: testsRoot });
			for (const f of files) {
				mocha.addFile(path.resolve(testsRoot, f));
			}

			// Run the mocha test
			mocha.run((failures: number) => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}