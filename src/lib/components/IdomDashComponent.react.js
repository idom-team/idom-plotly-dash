import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {mountLayout} from 'idom-client-react';

let loc = window.location;
let wsProtocol;
if (loc.protocol === 'https:') {
    wsProtocol = 'wss:';
} else {
    wsProtocol = 'ws:';
}

const baseWebSocketUrl = wsProtocol + '//' + loc.host + loc.pathname;
const baseHttpUrl = loc.protocol + '//' + loc.host + loc.pathname;

export default class IdomDashComponent extends Component {
    constructor(props) {
        super(props);
        this.mountPoint = React.createRef();
    }
    render() {
        return <div ref={this.mountPoint} />;
    }
    componentDidMount() {
        // We have to use eval() here because webpack doesn't know about this URL
        eval(`import('${baseHttpUrl + this.props.clientModuleUrl}')`).then((idomClient) => {
            const ws = new WebSocket(
                baseWebSocketUrl + `_idom/stream?view_id=${this.props.viewId}`
            );

            function saveUpdateHook(update) {
                ws.onmessage = (event) => {
                    const [pathPrefix, patch] = JSON.parse(event.data);
                    update(pathPrefix, patch);
                };
            }

            function sendEvent(event) {
                ws.send(JSON.stringify(event));
            }

            idomClient.mountLayout(
                this.mountPoint.current,
                saveUpdateHook,
                sendEvent,
                baseHttpUrl
            );
        });
    }
}

IdomDashComponent.defaultProps = {};

IdomDashComponent.propTypes = {
    /**
     * The view ID for this component instance
     */
    viewId: PropTypes.string,

    /**
     *
     */
    clientModuleUrl: PropTypes.string,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func,
};
