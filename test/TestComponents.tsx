import { Component } from 'react';
import { decorate } from 'react-mixin';

import LocalStorageMixin from '../src/react-localstorage';

@decorate(LocalStorageMixin)
class ComponentUseDisplayName extends Component<{ localStorageKey?: boolean | string | (() => string | undefined | boolean), otherKey?: string }> {
    static displayName = 'component1';

    render() {
        return <div>hello</div>;
    }
}

@decorate(LocalStorageMixin)
class ComponentUseStorageKey extends Component {
    static displayName = 'component2';
    static defaultProps = {
        'localStorageKey': 'component-key'
    };

    render() {
      return <div>hello</div>;
    }
}

@decorate(LocalStorageMixin)
class ComponentUseMethod extends Component {
    static displayName = 'ComponentUseMethod';

    getLocalStorageKey() {
        return `${ComponentUseMethod.displayName}DynamicSuffix`;
    }

    render() {
        return <div>hello</div>;
    }
}

@decorate(LocalStorageMixin)
class ComponentWithNoSetting extends Component {
    static displayName = 'ComponentWithNoSetting';

    render() {
        return <div>hello</div>;
    }
}

@decorate(LocalStorageMixin)
class ComponentUseStateFilter extends Component {
    static displayName = 'componentStateFilter';
    static defaultProps = {
        stateFilterKeys: ['a', 'b']
    };

    render() {
        return <div>hello</div>;
    }
}

@decorate(LocalStorageMixin)
class ComponentUseStateFilterFunction extends Component {
    static displayName = 'componentStateFilterFunc';

    getStateFilterKeys() {
        return ['a', 'b'];
    }

    render() {
        return <div>hello</div>;
    }
}


export {
    ComponentUseDisplayName,
    ComponentUseMethod,
    ComponentUseStorageKey,
    ComponentWithNoSetting,
    ComponentUseStateFilter,
    ComponentUseStateFilterFunction
};
