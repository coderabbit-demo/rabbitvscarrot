// Thin client-side wrapper around WebSocket. Messages sent before the socket
// is open are queued and flushed once the connection is established. If the
// connection drops unexpectedly it retries after a short delay.
(function (global) {
  function connect(handlers) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}`;
    const queue = [];
    let ws;
    let manuallyClosed = false;

    function open() {
      ws = new WebSocket(url);

      ws.addEventListener('open', () => {
        while (queue.length) ws.send(queue.shift());
        if (handlers.onOpen) handlers.onOpen();
      });

      ws.addEventListener('message', (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (handlers.onMessage) handlers.onMessage(msg);
      });

      ws.addEventListener('close', () => {
        if (handlers.onClose) handlers.onClose();
        if (!manuallyClosed) setTimeout(open, 1000);
      });
    }

    open();

    return {
      send(obj) {
        const data = JSON.stringify(obj);
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
        else queue.push(data);
      },
      close() {
        manuallyClosed = true;
        ws.close();
      },
    };
  }

  global.Net = { connect };
})(window);
