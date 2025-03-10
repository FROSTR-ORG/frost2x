"use strict";
(() => {
  // src/providers/nostr-provider.ts
  self.nostr = {
    _requests: {},
    _pubkey: null,
    async getPublicKey() {
      if (this._pubkey === null) {
        this._pubkey = await this._call("nostr.getPublicKey", {});
      }
      if (typeof this._pubkey !== "string") {
        throw new Error("Failed to get public key");
      }
      return this._pubkey;
    },
    async signEvent(event) {
      return this._call("nostr.signEvent", { event });
    },
    async getRelays() {
      return this._call("nostr.getRelays", {});
    },
    nip04: {
      async encrypt(peer, plaintext) {
        return self.nostr._call("nostr.nip04.encrypt", { peer, plaintext });
      },
      async decrypt(peer, ciphertext) {
        return self.nostr._call("nostr.nip04.decrypt", { peer, ciphertext });
      }
    },
    nip44: {
      async encrypt(peer, plaintext) {
        return self.nostr._call("nostr.nip44.encrypt", { peer, plaintext });
      },
      async decrypt(peer, ciphertext) {
        return self.nostr._call("nostr.nip44.decrypt", { peer, ciphertext });
      }
    },
    _call(type, params) {
      let id = Math.random().toString().slice(-4);
      console.log(
        "%c[frost2x:%c" + id + "%c]%c calling %c" + type + "%c with %c" + JSON.stringify(params || {}),
        "background-color:#f1b912;font-weight:bold;color:white",
        "background-color:#f1b912;font-weight:bold;color:#a92727",
        "background-color:#f1b912;color:white;font-weight:bold",
        "color:auto",
        "font-weight:bold;color:#08589d;font-family:monospace",
        "color:auto",
        "font-weight:bold;color:#90b12d;font-family:monospace"
      );
      return new Promise((resolve, reject) => {
        this._requests[id] = { resolve, reject };
        self.postMessage(
          {
            id,
            ext: "frost2x",
            type,
            params
          },
          "*"
        );
      });
    }
  };
  self.addEventListener("message", (message) => {
    if (!message.data || message.data.response === null || message.data.response === void 0 || message.data.ext !== "frost2x" || !self.nostr._requests[message.data.id])
      return;
    if (message.data.response.error) {
      let error = new Error("frost2x: " + message.data.response.error.message);
      error.stack = message.data.response.error.stack;
      self.nostr._requests[message.data.id].reject(error);
    } else {
      self.nostr._requests[message.data.id].resolve(message.data.response);
    }
    console.log(
      "%c[frost2x:%c" + message.data.id + "%c]%c result: %c" + JSON.stringify(
        message?.data?.response || message?.data?.response?.error?.message || {}
      ),
      "background-color:#f1b912;font-weight:bold;color:white",
      "background-color:#f1b912;font-weight:bold;color:#a92727",
      "background-color:#f1b912;color:white;font-weight:bold",
      "color:auto",
      "font-weight:bold;color:#08589d"
    );
    delete self.nostr._requests[message.data.id];
  });
  var replacing = null;
  document.addEventListener("mousedown", replaceNostrSchemeLink);
  async function replaceNostrSchemeLink(e) {
    const target = e.target;
    if (target.tagName !== "A" || !target.href.startsWith("nostr:")) return;
    if (replacing === false) return;
    let response = await self.nostr._call("replace_url", { url: target.href });
    if (response === false) {
      replacing = false;
      return;
    }
    target.href = response;
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3Byb3ZpZGVycy9ub3N0ci1wcm92aWRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gRmlyc3QgZGVjbGFyZSB0aGUgd2luZG93IG5vc3RyIHByb3BlcnR5IHR5cGVcbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgbm9zdHI6IHtcbiAgICAgIF9yZXF1ZXN0czogUmVjb3JkPHN0cmluZywgeyByZXNvbHZlOiAodmFsdWU6IGFueSkgPT4gdm9pZCwgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkIH0+O1xuICAgICAgX3B1YmtleTogc3RyaW5nIHwgbnVsbDtcbiAgICAgIGdldFB1YmxpY0tleSgpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICBzaWduRXZlbnQoZXZlbnQ6IGFueSk6IFByb21pc2U8YW55PjtcbiAgICAgIGdldFJlbGF5cygpOiBQcm9taXNlPGFueT47XG4gICAgICBuaXAwNDoge1xuICAgICAgICBlbmNyeXB0KHBlZXI6IHN0cmluZywgcGxhaW50ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICAgIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICB9O1xuICAgICAgbmlwNDQ6IHtcbiAgICAgICAgZW5jcnlwdChwZWVyOiBzdHJpbmcsIHBsYWludGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgICBkZWNyeXB0KHBlZXI6IHN0cmluZywgY2lwaGVydGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgfTtcbiAgICAgIF9jYWxsKHR5cGU6IHN0cmluZywgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxhbnk+O1xuICAgIH1cbiAgfVxufVxuXG53aW5kb3cubm9zdHIgPSB7XG4gIF9yZXF1ZXN0cyA6IHt9LFxuICBfcHVia2V5ICAgOiBudWxsLFxuXG4gIGFzeW5jIGdldFB1YmxpY0tleSgpIHtcbiAgICBpZiAodGhpcy5fcHVia2V5ID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9wdWJrZXkgPSBhd2FpdCB0aGlzLl9jYWxsKCdub3N0ci5nZXRQdWJsaWNLZXknLCB7fSlcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9wdWJrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBnZXQgcHVibGljIGtleScpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wdWJrZXlcbiAgfSxcblxuICBhc3luYyBzaWduRXZlbnQoZXZlbnQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLl9jYWxsKCdub3N0ci5zaWduRXZlbnQnLCB7IGV2ZW50IH0pXG4gIH0sXG5cbiAgYXN5bmMgZ2V0UmVsYXlzKCkge1xuICAgIHJldHVybiB0aGlzLl9jYWxsKCdub3N0ci5nZXRSZWxheXMnLCB7fSlcbiAgfSxcblxuICBuaXAwNDoge1xuICAgIGFzeW5jIGVuY3J5cHQocGVlcjogc3RyaW5nLCBwbGFpbnRleHQ6IHN0cmluZykge1xuICAgICAgcmV0dXJuIHdpbmRvdy5ub3N0ci5fY2FsbCgnbm9zdHIubmlwMDQuZW5jcnlwdCcsIHtwZWVyLCBwbGFpbnRleHR9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWNyeXB0KHBlZXI6IHN0cmluZywgY2lwaGVydGV4dDogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCdub3N0ci5uaXAwNC5kZWNyeXB0Jywge3BlZXIsIGNpcGhlcnRleHR9KVxuICAgIH1cbiAgfSxcblxuICBuaXA0NDoge1xuICAgIGFzeW5jIGVuY3J5cHQocGVlcjogc3RyaW5nLCBwbGFpbnRleHQ6IHN0cmluZykge1xuICAgICAgcmV0dXJuIHdpbmRvdy5ub3N0ci5fY2FsbCgnbm9zdHIubmlwNDQuZW5jcnlwdCcsIHtwZWVyLCBwbGFpbnRleHR9KVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWNyeXB0KHBlZXI6IHN0cmluZywgY2lwaGVydGV4dDogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCdub3N0ci5uaXA0NC5kZWNyeXB0Jywge3BlZXIsIGNpcGhlcnRleHR9KVxuICAgIH1cbiAgfSxcblxuICBfY2FsbCh0eXBlOiBzdHJpbmcsIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgIGxldCBpZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zbGljZSgtNClcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICclY1tmcm9zdDJ4OiVjJyArXG4gICAgICAgIGlkICtcbiAgICAgICAgJyVjXSVjIGNhbGxpbmcgJWMnICtcbiAgICAgICAgdHlwZSArXG4gICAgICAgICclYyB3aXRoICVjJyArXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHBhcmFtcyB8fCB7fSksXG4gICAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6d2hpdGUnLFxuICAgICAgJ2JhY2tncm91bmQtY29sb3I6I2YxYjkxMjtmb250LXdlaWdodDpib2xkO2NvbG9yOiNhOTI3MjcnLFxuICAgICAgJ2JhY2tncm91bmQtY29sb3I6I2YxYjkxMjtjb2xvcjp3aGl0ZTtmb250LXdlaWdodDpib2xkJyxcbiAgICAgICdjb2xvcjphdXRvJyxcbiAgICAgICdmb250LXdlaWdodDpib2xkO2NvbG9yOiMwODU4OWQ7Zm9udC1mYW1pbHk6bW9ub3NwYWNlJyxcbiAgICAgICdjb2xvcjphdXRvJyxcbiAgICAgICdmb250LXdlaWdodDpib2xkO2NvbG9yOiM5MGIxMmQ7Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xuICAgIClcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fcmVxdWVzdHNbaWRdID0ge3Jlc29sdmUsIHJlamVjdH1cbiAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShcbiAgICAgICAge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGV4dDogJ2Zyb3N0MngnLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgcGFyYW1zXG4gICAgICAgIH0sXG4gICAgICAgICcqJ1xuICAgICAgKVxuICAgIH0pXG4gIH1cbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBtZXNzYWdlID0+IHtcbiAgaWYgKFxuICAgICFtZXNzYWdlLmRhdGEgfHxcbiAgICBtZXNzYWdlLmRhdGEucmVzcG9uc2UgPT09IG51bGwgfHxcbiAgICBtZXNzYWdlLmRhdGEucmVzcG9uc2UgPT09IHVuZGVmaW5lZCB8fFxuICAgIG1lc3NhZ2UuZGF0YS5leHQgIT09ICdmcm9zdDJ4JyB8fFxuICAgICF3aW5kb3cubm9zdHIuX3JlcXVlc3RzW21lc3NhZ2UuZGF0YS5pZF1cbiAgKVxuICAgIHJldHVyblxuXG4gIGlmIChtZXNzYWdlLmRhdGEucmVzcG9uc2UuZXJyb3IpIHtcbiAgICBsZXQgZXJyb3IgPSBuZXcgRXJyb3IoJ2Zyb3N0Mng6ICcgKyBtZXNzYWdlLmRhdGEucmVzcG9uc2UuZXJyb3IubWVzc2FnZSlcbiAgICBlcnJvci5zdGFjayA9IG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvci5zdGFja1xuICAgIHdpbmRvdy5ub3N0ci5fcmVxdWVzdHNbbWVzc2FnZS5kYXRhLmlkXS5yZWplY3QoZXJyb3IpXG4gIH0gZWxzZSB7XG4gICAgd2luZG93Lm5vc3RyLl9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdLnJlc29sdmUobWVzc2FnZS5kYXRhLnJlc3BvbnNlKVxuICB9XG5cbiAgY29uc29sZS5sb2coXG4gICAgJyVjW2Zyb3N0Mng6JWMnICtcbiAgICAgIG1lc3NhZ2UuZGF0YS5pZCArXG4gICAgICAnJWNdJWMgcmVzdWx0OiAlYycgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIG1lc3NhZ2U/LmRhdGE/LnJlc3BvbnNlIHx8IG1lc3NhZ2U/LmRhdGE/LnJlc3BvbnNlPy5lcnJvcj8ubWVzc2FnZSB8fCB7fVxuICAgICAgKSxcbiAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6d2hpdGUnLFxuICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjojYTkyNzI3JyxcbiAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2NvbG9yOndoaXRlO2ZvbnQtd2VpZ2h0OmJvbGQnLFxuICAgICdjb2xvcjphdXRvJyxcbiAgICAnZm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjojMDg1ODlkJ1xuICApXG5cbiAgZGVsZXRlIHdpbmRvdy5ub3N0ci5fcmVxdWVzdHNbbWVzc2FnZS5kYXRhLmlkXVxufSlcblxuLy8gRml4IHRoZSByZXBsYWNpbmcgdmFyaWFibGUgdHlwZVxubGV0IHJlcGxhY2luZzogYm9vbGVhbiB8IG51bGwgPSBudWxsO1xuXG4vLyBGaXggdGhlIGV2ZW50IHBhcmFtZXRlciB0eXBlXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCByZXBsYWNlTm9zdHJTY2hlbWVMaW5rKVxuYXN5bmMgZnVuY3Rpb24gcmVwbGFjZU5vc3RyU2NoZW1lTGluayhlOiBNb3VzZUV2ZW50KSB7XG4gIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxBbmNob3JFbGVtZW50O1xuICBpZiAodGFyZ2V0LnRhZ05hbWUgIT09ICdBJyB8fCAhdGFyZ2V0LmhyZWYuc3RhcnRzV2l0aCgnbm9zdHI6JykpIHJldHVyblxuICBcbiAgaWYgKHJlcGxhY2luZyA9PT0gZmFsc2UpIHJldHVyblxuXG4gIGxldCByZXNwb25zZSA9IGF3YWl0IHdpbmRvdy5ub3N0ci5fY2FsbCgncmVwbGFjZV91cmwnLCB7dXJsOiB0YXJnZXQuaHJlZn0pXG5cbiAgaWYgKHJlc3BvbnNlID09PSBmYWxzZSkge1xuICAgIHJlcGxhY2luZyA9IGZhbHNlXG4gICAgcmV0dXJuXG4gIH1cblxu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
