const clients = new Set()

function createContentSyncBroadcaster() {
  const localClients = new Set()

  const heartbeat = setInterval(() => {
    for (const client of Array.from(localClients)) {
      try {
        client.write(': heartbeat\n\n')
      } catch {
        localClients.delete(client)
      }
    }
  }, 15000)

  function addClient(client) {
    localClients.add(client)
    client.write(': connected\n\n')
    client.write('retry: 1000\n\n')

    return () => {
      localClients.delete(client)
    }
  }

  function broadcast(eventName, payload = {}) {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`

    for (const client of Array.from(localClients)) {
      try {
        client.write(message)
      } catch {
        localClients.delete(client)
      }
    }
  }

  function broadcastOffersChanged() {
    broadcast('offers-changed', { type: 'offers' })
  }

  function broadcastMenuItemsChanged() {
    broadcast('menu-items-changed', { type: 'menu-items' })
  }

  function broadcastContentChanged() {
    broadcast('content-changed', { type: 'content' })
  }

  return {
    addClient,
    broadcastOffersChanged,
    broadcastMenuItemsChanged,
    broadcastContentChanged,
  }
}

const broadcaster = createContentSyncBroadcaster()

module.exports = {
  createContentSyncBroadcaster,
  addSseClient: (client) => broadcaster.addClient(client),
  broadcastOffersChanged: () => broadcaster.broadcastOffersChanged(),
  broadcastMenuItemsChanged: () => broadcaster.broadcastMenuItemsChanged(),
  broadcastContentChanged: () => broadcaster.broadcastContentChanged(),
}
