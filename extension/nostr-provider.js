"use strict";
(() => {
  // src/nostr-provider.ts
  self.nostr = {
    _requests: {},
    _pubkey: null,
    async getPublicKey() {
      if (this._pubkey === null) {
        this._pubkey = await this._call("getPublicKey", {});
      }
      if (typeof this._pubkey !== "string") {
        throw new Error("Failed to get public key");
      }
      return this._pubkey;
    },
    async signEvent(event) {
      return this._call("signEvent", { event });
    },
    async getRelays() {
      return this._call("getRelays", {});
    },
    nip04: {
      async encrypt(peer, plaintext) {
        return self.nostr._call("nip04.encrypt", { peer, plaintext });
      },
      async decrypt(peer, ciphertext) {
        return self.nostr._call("nip04.decrypt", { peer, ciphertext });
      }
    },
    nip44: {
      async encrypt(peer, plaintext) {
        return self.nostr._call("nip44.encrypt", { peer, plaintext });
      },
      async decrypt(peer, ciphertext) {
        return self.nostr._call("nip44.decrypt", { peer, ciphertext });
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
    let response = await self.nostr._call("replaceURL", { url: target.href });
    if (response === false) {
      replacing = false;
      return;
    }
    target.href = response;
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL25vc3RyLXByb3ZpZGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBGaXJzdCBkZWNsYXJlIHRoZSB3aW5kb3cgbm9zdHIgcHJvcGVydHkgdHlwZVxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICBub3N0cjoge1xuICAgICAgX3JlcXVlc3RzOiBSZWNvcmQ8c3RyaW5nLCB7IHJlc29sdmU6ICh2YWx1ZTogYW55KSA9PiB2b2lkLCByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQgfT47XG4gICAgICBfcHVia2V5OiBzdHJpbmcgfCBudWxsO1xuICAgICAgZ2V0UHVibGljS2V5KCk6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgIHNpZ25FdmVudChldmVudDogYW55KTogUHJvbWlzZTxhbnk+O1xuICAgICAgZ2V0UmVsYXlzKCk6IFByb21pc2U8YW55PjtcbiAgICAgIG5pcDA0OiB7XG4gICAgICAgIGVuY3J5cHQocGVlcjogc3RyaW5nLCBwbGFpbnRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgICAgZGVjcnlwdChwZWVyOiBzdHJpbmcsIGNpcGhlcnRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgIH07XG4gICAgICBuaXA0NDoge1xuICAgICAgICBlbmNyeXB0KHBlZXI6IHN0cmluZywgcGxhaW50ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICAgIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICB9O1xuICAgICAgX2NhbGwodHlwZTogc3RyaW5nLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPGFueT47XG4gICAgfVxuICB9XG59XG5cbndpbmRvdy5ub3N0ciA9IHtcbiAgX3JlcXVlc3RzOiB7fSxcbiAgX3B1YmtleTogbnVsbCxcblxuICBhc3luYyBnZXRQdWJsaWNLZXkoKSB7XG4gICAgaWYgKHRoaXMuX3B1YmtleSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fcHVia2V5ID0gYXdhaXQgdGhpcy5fY2FsbCgnZ2V0UHVibGljS2V5Jywge30pXG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5fcHVia2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZ2V0IHB1YmxpYyBrZXknKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcHVia2V5XG4gIH0sXG5cbiAgYXN5bmMgc2lnbkV2ZW50KGV2ZW50OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FsbCgnc2lnbkV2ZW50Jywge2V2ZW50fSlcbiAgfSxcblxuICBhc3luYyBnZXRSZWxheXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGwoJ2dldFJlbGF5cycsIHt9KVxuICB9LFxuXG4gIG5pcDA0OiB7XG4gICAgYXN5bmMgZW5jcnlwdChwZWVyOiBzdHJpbmcsIHBsYWludGV4dDogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCduaXAwNC5lbmNyeXB0Jywge3BlZXIsIHBsYWludGV4dH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubm9zdHIuX2NhbGwoJ25pcDA0LmRlY3J5cHQnLCB7cGVlciwgY2lwaGVydGV4dH0pXG4gICAgfVxuICB9LFxuXG4gIG5pcDQ0OiB7XG4gICAgYXN5bmMgZW5jcnlwdChwZWVyOiBzdHJpbmcsIHBsYWludGV4dDogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCduaXA0NC5lbmNyeXB0Jywge3BlZXIsIHBsYWludGV4dH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubm9zdHIuX2NhbGwoJ25pcDQ0LmRlY3J5cHQnLCB7cGVlciwgY2lwaGVydGV4dH0pXG4gICAgfVxuICB9LFxuXG4gIF9jYWxsKHR5cGU6IHN0cmluZywgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgbGV0IGlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnNsaWNlKC00KVxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgJyVjW2Zyb3N0Mng6JWMnICtcbiAgICAgICAgaWQgK1xuICAgICAgICAnJWNdJWMgY2FsbGluZyAlYycgK1xuICAgICAgICB0eXBlICtcbiAgICAgICAgJyVjIHdpdGggJWMnICtcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkocGFyYW1zIHx8IHt9KSxcbiAgICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjp3aGl0ZScsXG4gICAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2E5MjcyNycsXG4gICAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2NvbG9yOndoaXRlO2ZvbnQtd2VpZ2h0OmJvbGQnLFxuICAgICAgJ2NvbG9yOmF1dG8nLFxuICAgICAgJ2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6IzA4NTg5ZDtmb250LWZhbWlseTptb25vc3BhY2UnLFxuICAgICAgJ2NvbG9yOmF1dG8nLFxuICAgICAgJ2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6IzkwYjEyZDtmb250LWZhbWlseTptb25vc3BhY2UnXG4gICAgKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLl9yZXF1ZXN0c1tpZF0gPSB7cmVzb2x2ZSwgcmVqZWN0fVxuICAgICAgd2luZG93LnBvc3RNZXNzYWdlKFxuICAgICAgICB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgZXh0OiAnZnJvc3QyeCcsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBwYXJhbXNcbiAgICAgICAgfSxcbiAgICAgICAgJyonXG4gICAgICApXG4gICAgfSlcbiAgfVxufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG1lc3NhZ2UgPT4ge1xuICBpZiAoXG4gICAgIW1lc3NhZ2UuZGF0YSB8fFxuICAgIG1lc3NhZ2UuZGF0YS5yZXNwb25zZSA9PT0gbnVsbCB8fFxuICAgIG1lc3NhZ2UuZGF0YS5yZXNwb25zZSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgbWVzc2FnZS5kYXRhLmV4dCAhPT0gJ2Zyb3N0MngnIHx8XG4gICAgIXdpbmRvdy5ub3N0ci5fcmVxdWVzdHNbbWVzc2FnZS5kYXRhLmlkXVxuICApXG4gICAgcmV0dXJuXG5cbiAgaWYgKG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvcikge1xuICAgIGxldCBlcnJvciA9IG5ldyBFcnJvcignZnJvc3QyeDogJyArIG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvci5tZXNzYWdlKVxuICAgIGVycm9yLnN0YWNrID0gbWVzc2FnZS5kYXRhLnJlc3BvbnNlLmVycm9yLnN0YWNrXG4gICAgd2luZG93Lm5vc3RyLl9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdLnJlamVjdChlcnJvcilcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cubm9zdHIuX3JlcXVlc3RzW21lc3NhZ2UuZGF0YS5pZF0ucmVzb2x2ZShtZXNzYWdlLmRhdGEucmVzcG9uc2UpXG4gIH1cblxuICBjb25zb2xlLmxvZyhcbiAgICAnJWNbZnJvc3QyeDolYycgK1xuICAgICAgbWVzc2FnZS5kYXRhLmlkICtcbiAgICAgICclY10lYyByZXN1bHQ6ICVjJyArXG4gICAgICBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgbWVzc2FnZT8uZGF0YT8ucmVzcG9uc2UgfHwgbWVzc2FnZT8uZGF0YT8ucmVzcG9uc2U/LmVycm9yPy5tZXNzYWdlIHx8IHt9XG4gICAgICApLFxuICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjp3aGl0ZScsXG4gICAgJ2JhY2tncm91bmQtY29sb3I6I2YxYjkxMjtmb250LXdlaWdodDpib2xkO2NvbG9yOiNhOTI3MjcnLFxuICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Y29sb3I6d2hpdGU7Zm9udC13ZWlnaHQ6Ym9sZCcsXG4gICAgJ2NvbG9yOmF1dG8nLFxuICAgICdmb250LXdlaWdodDpib2xkO2NvbG9yOiMwODU4OWQnXG4gIClcblxuICBkZWxldGUgd2luZG93Lm5vc3RyLl9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdXG59KVxuXG4vLyBGaXggdGhlIHJlcGxhY2luZyB2YXJpYWJsZSB0eXBlXG5sZXQgcmVwbGFjaW5nOiBib29sZWFuIHwgbnVsbCA9IG51bGw7XG5cbi8vIEZpeCB0aGUgZXZlbnQgcGFyYW1ldGVyIHR5cGVcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHJlcGxhY2VOb3N0clNjaGVtZUxpbmspXG5hc3luYyBmdW5jdGlvbiByZXBsYWNlTm9zdHJTY2hlbWVMaW5rKGU6IE1vdXNlRXZlbnQpIHtcbiAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEFuY2hvckVsZW1lbnQ7XG4gIGlmICh0YXJnZXQudGFnTmFtZSAhPT0gJ0EnIHx8ICF0YXJnZXQuaHJlZi5zdGFydHNXaXRoKCdub3N0cjonKSkgcmV0dXJuXG4gIGlmIChyZXBsYWNpbmcgPT09IGZhbHNlKSByZXR1cm5cblxuICBsZXQgcmVzcG9uc2UgPSBhd2FpdCB3aW5kb3cubm9zdHIuX2NhbGwoJ3JlcGxhY2VVUkwnLCB7dXJsOiB0YXJnZXQuaHJlZn0pXG4gIGlmIChyZXNwb25zZSA9PT0gZmFsc2UpIHtcbiAgICByZXBsYWNpbmcgPSBmYWxzZVxuICAgIHJldHVyblxuICB9XG5cbiAgdGFyZ2V0LmhyZWYgPSByZXNwb25zZVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBc0JBLE9BQU8sUUFB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
