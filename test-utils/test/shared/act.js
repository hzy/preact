import { options, createElement as h, render } from 'preact';
import { useState } from 'preact/hooks';

import { setupScratch, teardown } from '../../../test/_util/helpers';
import { act } from '../../src';

/** @jsx h */
describe('act', () => {

	/** @type {HTMLDivElement} */
	let scratch;

	beforeEach(() => {
		scratch = setupScratch();
	});

	afterEach(() => {
		teardown(scratch);
	});

	it('should reset options after act finishes', () => {
		expect(options.afterPaint).to.equal(undefined);
		act(() => {
			console.log('testing');
		});
		expect(options.afterPaint).to.equal(undefined);
	});

	it('should drain the queue of hooks', () => {
		function StateContainer() {
			const [count, setCount] = useState(0);
			return (<div>
				<p>Count: {count}</p>
				<button onClick={() => setCount(c => c + 11)} />
			</div>);
		}

		render(<StateContainer />, scratch);
		expect(scratch.textContent).to.include('Count: 0');
		act(() => {
			const button = scratch.querySelector('button');
			button.click();
			expect(scratch.textContent).to.include('Count: 0');
		});
		expect(scratch.textContent).to.include('Count: 1');
	});
});
