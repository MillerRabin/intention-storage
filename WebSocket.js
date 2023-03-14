const WebSocket = await getWebsocket();

async function getWebsocket() {
    try {
        return { WebSocket: window.WebSocket };
    } catch (e) {
        return await import('ws');        
    }    
}

export default WebSocket;