import { type Component, type Mixin } from 'react';

import warn from './warning'

let hasLocalStorage = true;
const testKey = 'react-localstorage.mixin.test-key';
let localStorage: Storage;
try {
  // Access to global `localStorage` property must be guarded as it
  // fails under iOS private session mode.
  localStorage = global.localStorage;
  localStorage.setItem(testKey, 'foo');
  localStorage.removeItem(testKey);
} catch {
  hasLocalStorage = false;
}

// Warn if localStorage cannot be found or accessed.
if (!hasLocalStorage) {
  warn(
    hasLocalStorage,
    'localStorage not found. Component state will not be stored to localStorage.'
  );
}

interface LocalStorageMixin extends Mixin<unknown, unknown> {
    __react_localstorage_beforeunload?: () => void,
    __react_localstorage_loaded?: boolean
}

interface LocalStorageComponent extends Component<{ localStorageKey?: string | ((component: Component) => string), stateFilterKeys: string | string[] }> {
    __react_localstorage_loaded?: boolean
    getStateFilterKeys?: (() => string[]) | string
    getLocalStorageKey?: () => string
    displayName?: string
}

const LocalStorageDecorator: LocalStorageMixin = {
    /**
     * On unmount, save data.
     *
     * If the page unloads, this may not fire, so we also mount the function to onbeforeunload.
     */
    componentWillUnmount: function() {
        saveStateToLocalStorage(this as LocalStorageComponent);

        // Remove beforeunload handler if it exists.
        if (this.__react_localstorage_beforeunload) {
            global.removeEventListener('beforeunload', this.__react_localstorage_beforeunload);
        }
  },

    /**
     * Load data.
     * This seems odd to do this on componentDidMount, but it prevents server checksum errors.
     * This is because the server has no way to know what is in your localStorage. So instead
     * of breaking the checksum and causing a full rerender, we instead change the component after mount
     * for an efficient diff.
     */
    componentDidMount: function() {
        loadStateFromLocalStorage(this as LocalStorageComponent);

        // We won't get a componentWillUnmount event if we close the tab or refresh, so add a listener
        // and synchronously populate LS.
        if (hasLocalStorage && this.__react_localstorage_loaded && this.__react_localstorage_beforeunload) {
            global.addEventListener('beforeunload', this.__react_localstorage_beforeunload.bind(this));
        }
    }
};

function loadStateFromLocalStorage(component: LocalStorageComponent): void {
    if (!hasLocalStorage) {
        return;
    }

    const key = getLocalStorageKey(component);
    if (!key) {
        return;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const storedState = JSON.parse(localStorage.getItem(key)!) as typeof component.state | undefined;

        if (storedState) {
            component.setState(storedState);
        }
    } catch{
        console.warn("Unable to load state for", getDisplayName(component), "from localStorage.");
    }

    component.__react_localstorage_loaded = true;
}


function saveStateToLocalStorage(component: LocalStorageComponent) {
    if (!(hasLocalStorage && component.__react_localstorage_loaded)) {
        return;
    }

    const key = getLocalStorageKey(component);
    if (!key) {
        return;
    }

    localStorage.setItem(key, JSON.stringify(getSyncState(component)));
}

function getDisplayName(component: LocalStorageComponent): string {
    // at least, we cannot get displayname
    // via this.displayname in react 0.12
    return component.displayName ??
           (component.constructor as { displayName?: string }).displayName ??
           component.constructor.name;
}

function getLocalStorageKey(component: LocalStorageComponent): string | undefined {
    if (component.getLocalStorageKey) {
        return component.getLocalStorageKey();
    }

    if (!component.props.localStorageKey) {
        return undefined;
    }

    if (typeof component.props.localStorageKey === 'function') {
        return component.props.localStorageKey(component);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return component.props.localStorageKey ?? getDisplayName(component) ?? 'react-localstorage';
}

function getStateFilterKeys(component: LocalStorageComponent): string[] {
  if (component.getStateFilterKeys) {
    return typeof component.getStateFilterKeys === 'string' ? [component.getStateFilterKeys] : component.getStateFilterKeys()
  }

  return typeof component.props.stateFilterKeys === 'string' ? [component.props.stateFilterKeys] : component.props.stateFilterKeys;
}

/**
* Filters state to only save keys defined in stateFilterKeys.
* If stateFilterKeys is not set, returns full state.
*/
function getSyncState(component: LocalStorageComponent) {
    const state = component.state;
    const stateFilterKeys = getStateFilterKeys(component);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!(stateFilterKeys && state)) {
        return state;
    }

    const result: Record<string, unknown> = {};
    let key: string;
    for (const stateFilterKey of stateFilterKeys) {
        key = stateFilterKey;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (state[key as keyof typeof component.state]) {
            result[key] = state[key as keyof typeof component.state];
        }
    }

    return result;
}

export default LocalStorageDecorator;
