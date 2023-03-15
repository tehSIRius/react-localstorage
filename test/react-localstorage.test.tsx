import { type Component } from 'react';
import testUtil from 'react-dom/test-utils';

import {
    ComponentUseDisplayName,
    ComponentUseMethod,
    ComponentUseStateFilter,
    ComponentUseStateFilterFunction,
    ComponentUseStorageKey,
    ComponentWithNoSetting
} from './TestComponents';

describe("react-localstorage", () => {
    beforeEach(() => {
        localStorage.clear();

        vi.spyOn(global.console, "warn").mockImplementation(() => {
            // Placeholder
        });
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(global.console.warn).not.toBeCalled();
    });

    it("Should not Save After Each State", () => {
        // Even though the typings say the function returns void, it actually seems to return Component!
        const component = testUtil.renderIntoDocument(<ComponentUseDisplayName />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world'
        }, () => {
            expect(localStorage.getItem('component1')).toBeNull();
        });

        component.componentWillUnmount?.();
    });

    it("Should Use displayName to Store into localStorage", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseDisplayName />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world'
        }, () => {
            expect(localStorage.getItem('component1')).toBeNull();
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem("component1")).toBe(JSON.stringify({ a: 'world' }));
    });

    it("Should Use this.props.localStorageKey to Store into localStorage", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseStorageKey />) as unknown as Component<unknown, unknown>;

        component.setState({
            hello: 'moon'
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('component2')).toBeNull();
        expect(localStorage.getItem("component-key")).toBe(JSON.stringify({ hello: 'moon' }));
    });

    it("Should Use this.getLocalStorageKey() to Store into localStorage", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseMethod />) as unknown as Component<unknown, unknown>;

        component.setState({
            rubber: 'ducky'
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('ComponentUseMethod')).toBeNull();
        expect(localStorage.getItem('ComponentUseMethodDynamicSuffix')).toBe(JSON.stringify({ rubber: 'ducky' }));
    });

    it("Should Use ComponentWithNoSetting to Store into localStorage", () => {
        const component = testUtil.renderIntoDocument(<ComponentWithNoSetting />) as unknown as Component<unknown, unknown>;

        component.setState({
            hello: 'star'
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('ComponentWithNoSetting')).toBe(JSON.stringify({ hello: 'star' })); // NOTICE: not `react-localstorage` because of displayName
    });

    it("Should Only Use State Keys That Match Filter", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseStateFilter />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world',
            b: 'bar',
            c: 'shouldNotSync'
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('componentStateFilter')).toBe(JSON.stringify({ a: 'world', b: 'bar' }));
    });

    it("Should Only Use State Keys That Match Filter Function", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseStateFilterFunction />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world',
            b: 'bar',
            c: 'shouldNotSync'
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('componentStateFilterFunc')).toBe(JSON.stringify({ a: 'world', b: 'bar' }));
    });

    it("Should Shut Off Syncing with localStorageKey=false", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseDisplayName />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world',
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('component1')).toBe(JSON.stringify({ a: 'world' }));

        const component2 = testUtil.renderIntoDocument(<ComponentUseDisplayName localStorageKey={false} />) as unknown as Component<unknown, unknown>;

        component2.setState({ a: 'hello' });
        component2.componentWillUnmount?.();

        expect(localStorage.getItem('component1')).toBe(JSON.stringify({ a: 'world' }));
    });

    it("Should Support Function as LS Key", () => {
        const component = testUtil.renderIntoDocument(<ComponentUseDisplayName localStorageKey={function (this: ComponentUseDisplayName) {
            return this.props.otherKey;
        }} otherKey="jenkees" />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world',
        });
        component.componentWillUnmount?.();

        expect(localStorage.getItem('component1')).toBeNull();
        expect(localStorage.getItem("jenkees")).toBe(JSON.stringify({ a: 'world' }));

        const component2 = testUtil.renderIntoDocument(<ComponentUseDisplayName localStorageKey={() => false} />) as unknown as Component<unknown, unknown>;

        component2.setState({ a: 'hello' });
        component2.componentWillUnmount?.();

        expect(localStorage.getItem('component1')).toBeNull();
        expect(localStorage.getItem('jenkees')).toBe(JSON.stringify({ a: 'world' }));
    });

    it("Should Sync on beforeunload, Then Remove Itself", () => {
        const eventMap = new Map<Event | string, (() => unknown)>();
        vi.stubGlobal('addEventListener', (event: Event | string, callback: () => unknown) => {
            eventMap.set(event, callback);
        });
        vi.stubGlobal('removeEventListener', (event: Event | string, callback: () => unknown) => {
            if (event === 'beforeunload' && eventMap.get(event) !== callback) {
                throw new Error('Unexpected event!');
            }

            eventMap.delete(event);
        });

        const component = testUtil.renderIntoDocument(<ComponentUseDisplayName localStorageKey="beforeunload" />) as unknown as Component<unknown, unknown>;

        component.setState({
            a: 'world'
        });

        expect(eventMap.get('beforeunload')).toBeTruthy();
        expect(localStorage.getItem('beforeunload')).toBeNull();

        eventMap.get('beforeunload')?.();

        expect(localStorage.getItem('beforeunload')).toBe(JSON.stringify({ a: 'world' }));
        expect(eventMap.get('beforeunload')).toBeUndefined();
    });
})
