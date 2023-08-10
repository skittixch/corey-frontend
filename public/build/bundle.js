
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (147:0) {#if imageData}
    function create_if_block_2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*imageData*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", img_class_value = /*imageLoaded*/ ctx[3] ? "fade-in" : "");
    			add_location(img, file, 148, 4, 5372);
    			attr_dev(div, "class", "image-container");
    			add_location(div, file, 147, 2, 5337);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageData*/ 2 && !src_url_equal(img.src, img_src_value = /*imageData*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*imageLoaded*/ 8 && img_class_value !== (img_class_value = /*imageLoaded*/ ctx[3] ? "fade-in" : "")) {
    				attr_dev(img, "class", img_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(147:0) {#if imageData}",
    		ctx
    	});

    	return block;
    }

    // (156:0) {#if currentImageData}
    function create_if_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*currentImageData*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "output");
    			attr_dev(img, "class", img_class_value = /*imageLoaded*/ ctx[3] ? "fade-in" : "");
    			add_location(img, file, 157, 4, 5568);
    			attr_dev(div, "class", "current-image-container");
    			add_location(div, file, 156, 2, 5525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(img, "error", /*error_handler*/ ctx[9], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentImageData*/ 4 && !src_url_equal(img.src, img_src_value = /*currentImageData*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*imageLoaded*/ 8 && img_class_value !== (img_class_value = /*imageLoaded*/ ctx[3] ? "fade-in" : "")) {
    				attr_dev(img, "class", img_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(156:0) {#if currentImageData}",
    		ctx
    	});

    	return block;
    }

    // (167:0) {#if progressData && !imageLoaded}
    function create_if_block(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1_value = /*progressData*/ ctx[5].progress * 100 + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("Progress: ");
    			t1 = text(t1_value);
    			t2 = text("%");
    			add_location(p, file, 169, 4, 5862);
    			attr_dev(div, "class", "progress-container");
    			add_location(div, file, 168, 2, 5824);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*progressData*/ 32 && t1_value !== (t1_value = /*progressData*/ ctx[5].progress * 100 + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(167:0) {#if progressData && !imageLoaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let head;
    	let link;
    	let t0;
    	let div1;
    	let div0;
    	let input;
    	let t1;
    	let button;
    	let img;
    	let img_src_value;
    	let button_disabled_value;
    	let div1_class_value;
    	let t2;
    	let t3;
    	let p;
    	let t5;
    	let t6;
    	let if_block2_anchor;
    	let mounted;
    	let dispose;
    	let if_block0 = /*imageData*/ ctx[1] && create_if_block_2(ctx);
    	let if_block1 = /*currentImageData*/ ctx[2] && create_if_block_1(ctx);
    	let if_block2 = /*progressData*/ ctx[5] && !/*imageLoaded*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			head = element("head");
    			link = element("link");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			img = element("img");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			p = element("p");
    			p.textContent = "alpha v0.0.3";
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "./AppStyle.css");
    			add_location(link, file, 124, 2, 4711);
    			add_location(head, file, 123, 0, 4701);
    			attr_dev(input, "placeholder", "Corey...");
    			add_location(input, file, 130, 4, 4915);
    			if (!src_url_equal(img.src, img_src_value = "./send.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Send");
    			attr_dev(img, "class", "arrow-icon");
    			add_location(img, file, 141, 7, 5188);
    			attr_dev(button, "class", "send-button");
    			button.disabled = button_disabled_value = /*dataSent*/ ctx[4] && !/*imageLoaded*/ ctx[3];
    			add_location(button, file, 137, 4, 5068);
    			attr_dev(div0, "class", "input-container");
    			add_location(div0, file, 129, 2, 4880);
    			attr_dev(div1, "class", div1_class_value = /*dataSent*/ ctx[4] ? "container sent" : "container");
    			add_location(div1, file, 128, 0, 4821);
    			add_location(p, file, 153, 0, 5476);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, head, anchor);
    			append_dev(head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*prompt*/ ctx[0]);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, img);
    			insert_dev(target, t2, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(input, "click", /*click_handler*/ ctx[8], false, false, false, false),
    					listen_dev(button, "click", /*prepareSendData*/ ctx[6], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*prompt*/ 1 && input.value !== /*prompt*/ ctx[0]) {
    				set_input_value(input, /*prompt*/ ctx[0]);
    			}

    			if (dirty & /*dataSent, imageLoaded*/ 24 && button_disabled_value !== (button_disabled_value = /*dataSent*/ ctx[4] && !/*imageLoaded*/ ctx[3])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*dataSent*/ 16 && div1_class_value !== (div1_class_value = /*dataSent*/ ctx[4] ? "container sent" : "container")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (/*imageData*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t3.parentNode, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*currentImageData*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(t6.parentNode, t6);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*progressData*/ ctx[5] && !/*imageLoaded*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(head);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t5);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadImageAsBase64(imagePath) {
    	const response = await fetch(imagePath);
    	const blob = await response.blob();

    	return new Promise(resolve => {
    			const reader = new FileReader();
    			reader.onloadend = () => resolve(reader.result.split(",")[1]);
    			reader.readAsDataURL(blob);
    		});
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let prompt = "";
    	let imageData = "";
    	let currentImageData = ""; // ADDED: Variable to hold the current image data
    	let imageLoaded = false;
    	let dataSent = false;
    	let progressData = null;

    	async function prepareSendData() {
    		let imagePath = "./roop.png";
    		let img_base64 = await loadImageAsBase64(imagePath);

    		let args = [
    			img_base64,
    			true,
    			"0",
    			"/usr/src/app/models/roop/inswapper_128.onnx",
    			"CodeFormer",
    			1,
    			"None",
    			1,
    			"None",
    			false,
    			true
    		];

    		sendData(args); // Call sendData with the prepared args
    	}

    	async function fetchProgress() {
    		const response = await fetch("https://ai.ericbacus.com/sdapi/v1/progress", {
    			method: "GET",
    			headers: { "Content-Type": "application/json" },
    			mode: "cors"
    		});

    		if (!response.ok) {
    			throw new Error(`HTTP error! status: ${response.status}`);
    		}

    		const result = await response.json();
    		$$invalidate(5, progressData = result);

    		// ADDED: Update currentImageData with the current_image data
    		$$invalidate(2, currentImageData = `data:image/png;base64,${result.current_image}`);

    		// If progress is not complete, fetch again
    		if (result.progress < 100) {
    			$$invalidate(3, imageLoaded = true);
    			setTimeout(fetchProgress, 1000);
    		}
    	}

    	async function sendData(args) {
    		console.log("sendData called, initial imageLoaded:", imageLoaded);
    		$$invalidate(3, imageLoaded = false);
    		$$invalidate(4, dataSent = true);
    		let tempPrompt = prompt.replace(/corey/gi, "<lora:crzx_v09:1> (ohwx:1.4) man");
    		tempPrompt += " (excited:.1), epic composition, renaissance composition, rule of thirds, clarity, award winning, blonde curly hair and beard <lora:actionshot:1>";

    		// ADDED: Moved the fetch operation into a separate variable
    		const responsePromise = fetch("https://ai.ericbacus.com/sdapi/v1/txt2img", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			mode: "cors",
    			body: JSON.stringify({
    				cfg_scale: 7,
    				prompt: tempPrompt,
    				negative_prompt: "nsfw CyberRealistic_Negative-neg realisticvision-negative-embedding, nsfw, canvas frame, cartoon, 3d, ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), wierd colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, deformed, cross-eye, body out of frame, blurry, bad art, bad anatomy, 3d render, (skinny:1.3), muscular, eyeliner, defined curls, mullet, quaffed, stylish, sharp pointy teeth, bow in hair, vampire, fade, flat top, cheek crease, dimples, (closeup:1.5), portrait, old, handsome",
    				steps: 50,
    				sampler_name: "DPM++ 2M SDE Karras",
    				restore_faces: true,
    				alwayson_scripts: { roop: { args } }
    			})
    		});

    		// ADDED: Start fetching progress immediately after sending the request
    		fetchProgress();

    		// ADDED: Await the response after starting the progress fetching
    		const response = await responsePromise;

    		if (!response.ok) {
    			throw new Error(`HTTP error! status: ${response.status}`);
    		}

    		const result = await response.json();
    		console.log(result);
    		$$invalidate(1, imageData = `data:image/png;base64,${result.images[0]}`);
    		$$invalidate(3, imageLoaded = true);
    		console.log("Data Sent, imageLoaded:", imageLoaded);
    	}

    	afterUpdate(() => {
    		if (imageData) {
    			const img = new Image();
    			img.src = imageData;

    			img.onload = () => {
    				$$invalidate(3, imageLoaded = true);
    			};
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		prompt = this.value;
    		$$invalidate(0, prompt);
    	}

    	const click_handler = () => {
    		if (!prompt) $$invalidate(0, prompt = "Corey ");
    	};

    	const error_handler = () => $$invalidate(2, currentImageData = null);

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		prompt,
    		imageData,
    		currentImageData,
    		imageLoaded,
    		dataSent,
    		progressData,
    		loadImageAsBase64,
    		prepareSendData,
    		fetchProgress,
    		sendData
    	});

    	$$self.$inject_state = $$props => {
    		if ('prompt' in $$props) $$invalidate(0, prompt = $$props.prompt);
    		if ('imageData' in $$props) $$invalidate(1, imageData = $$props.imageData);
    		if ('currentImageData' in $$props) $$invalidate(2, currentImageData = $$props.currentImageData);
    		if ('imageLoaded' in $$props) $$invalidate(3, imageLoaded = $$props.imageLoaded);
    		if ('dataSent' in $$props) $$invalidate(4, dataSent = $$props.dataSent);
    		if ('progressData' in $$props) $$invalidate(5, progressData = $$props.progressData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		prompt,
    		imageData,
    		currentImageData,
    		imageLoaded,
    		dataSent,
    		progressData,
    		prepareSendData,
    		input_input_handler,
    		click_handler,
    		error_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
