const WebSocket = await getWebsocket();

async function getWebsocket() {
    try {
        return window.WebSocket;
    } catch (e) {
        return await import('ws');        
    }    
}

export default WebSocket;