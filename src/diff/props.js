import { IS_NON_DIMENSIONAL } from '../constants';
import options from '../options';

function setStyle(style, key, value) {
	if (key[0] === '-') {
		style.setProperty(key, value == null ? '' : value);
	} else if (value == null) {
		style[key] = '';
	} else if (typeof value != 'number' || IS_NON_DIMENSIONAL.test(key)) {
		style[key] = value;
	} else {
		style[key] = value + 'px';
	}
}

// A logical clock to solve issues like https://github.com/preactjs/preact/issues/3927.
// When the DOM performs an event it leaves micro-ticks in between bubbling up which means that
// an event can trigger on a newly reated DOM-node while the event bubbles up.
//
// Originally inspired by Vue
// (https://github.com/vuejs/core/blob/caeb8a68811a1b0f79/packages/runtime-dom/src/modules/events.ts#L90-L101),
// but modified to use a logical clock instead of Date.now() in case event handlers get attached
// and events get dispatched during the same millisecond.
//
// The clock is incremented after each new event dispatch. This allows 1 000 000 new events
// per second for over 280 years before the value reaches Number.MAX_SAFE_INTEGER (2**53 - 1).
let eventClock = 0;

/**
 * Set a property value on a DOM node
 * @param {PreactElement} dom The DOM node to modify
 * @param {string} name The name of the property to set
 * @param {*} value The value to set the property to
 * @param {*} oldValue The old value the property had
 * @param {string} namespace Whether or not this DOM node is an SVG node or not
 */
export function setProperty(dom, name, value, oldValue, namespace) {
	if (value != null && (value !== false || name[4] === '-')) {
		dom.setAttribute(name, name == 'popover' && value == true ? '' : value);
	}
}

/**
 * Create an event proxy function.
 * @param {boolean} useCapture Is the event handler for the capture phase.
 * @private
 */
function createEventProxy(useCapture) {
	/**
	 * Proxy an event to hooked event handlers
	 * @param {PreactEvent} e The event object from the browser
	 * @private
	 */
	return function (e) {
		if (this._listeners) {
			const eventHandler = this._listeners[e.type + useCapture];
			if (e._dispatched == null) {
				e._dispatched = eventClock++;

				// When `e._dispatched` is smaller than the time when the targeted event
				// handler was attached we know we have bubbled up to an element that was added
				// during patching the DOM.
			} else if (e._dispatched < eventHandler._attached) {
				return;
			}
			return eventHandler(options.event ? options.event(e) : e);
		}
	};
}

const eventProxy = createEventProxy(false);
const eventProxyCapture = createEventProxy(true);
