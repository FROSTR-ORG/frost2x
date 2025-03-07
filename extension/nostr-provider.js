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
    wallet: {
      async getAccount() {
        return self.nostr._call("wallet.getAccount", {});
      },
      async getBalance() {
        return self.nostr._call("wallet.getBalance", {});
      },
      async getUtxos(amount) {
        return self.nostr._call("wallet.getUtxos", { amount });
      },
      async signPsbt(psbt) {
        return self.nostr._call("wallet.signPsbt", { psbt });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL25vc3RyLXByb3ZpZGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFdhbGxldEFjY291bnQsIFdhbGxldFV0eG8gfSBmcm9tICcuL3R5cGVzL2luZGV4LmpzJ1xuXG4vLyBGaXJzdCBkZWNsYXJlIHRoZSB3aW5kb3cgbm9zdHIgcHJvcGVydHkgdHlwZVxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICBub3N0cjoge1xuICAgICAgX3JlcXVlc3RzOiBSZWNvcmQ8c3RyaW5nLCB7IHJlc29sdmU6ICh2YWx1ZTogYW55KSA9PiB2b2lkLCByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQgfT47XG4gICAgICBfcHVia2V5OiBzdHJpbmcgfCBudWxsO1xuICAgICAgZ2V0UHVibGljS2V5KCk6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgIHNpZ25FdmVudChldmVudDogYW55KTogUHJvbWlzZTxhbnk+O1xuICAgICAgZ2V0UmVsYXlzKCk6IFByb21pc2U8YW55PjtcbiAgICAgIG5pcDA0OiB7XG4gICAgICAgIGVuY3J5cHQocGVlcjogc3RyaW5nLCBwbGFpbnRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgICAgZGVjcnlwdChwZWVyOiBzdHJpbmcsIGNpcGhlcnRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgIH07XG4gICAgICBuaXA0NDoge1xuICAgICAgICBlbmNyeXB0KHBlZXI6IHN0cmluZywgcGxhaW50ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICAgIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICB9O1xuICAgICAgd2FsbGV0OiB7XG4gICAgICAgIGdldEFjY291bnQoKTogUHJvbWlzZTxXYWxsZXRBY2NvdW50PjtcbiAgICAgICAgZ2V0QmFsYW5jZSgpOiBQcm9taXNlPG51bWJlcj47XG4gICAgICAgIGdldFV0eG9zKGFtb3VudDogbnVtYmVyKTogUHJvbWlzZTxXYWxsZXRVdHhvW10+O1xuICAgICAgICBzaWduUHNidChwc2J0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICB9O1xuICAgICAgX2NhbGwodHlwZTogc3RyaW5nLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPGFueT47XG4gICAgfVxuICB9XG59XG5cbndpbmRvdy5ub3N0ciA9IHtcbiAgX3JlcXVlc3RzIDoge30sXG4gIF9wdWJrZXkgICA6IG51bGwsXG5cbiAgYXN5bmMgZ2V0UHVibGljS2V5KCkge1xuICAgIGlmICh0aGlzLl9wdWJrZXkgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3B1YmtleSA9IGF3YWl0IHRoaXMuX2NhbGwoJ2dldFB1YmxpY0tleScsIHt9KVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMuX3B1YmtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGdldCBwdWJsaWMga2V5JylcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3B1YmtleVxuICB9LFxuXG4gIGFzeW5jIHNpZ25FdmVudChldmVudDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGwoJ3NpZ25FdmVudCcsIHsgZXZlbnQgfSlcbiAgfSxcblxuICBhc3luYyBnZXRSZWxheXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGwoJ2dldFJlbGF5cycsIHt9KVxuICB9LFxuXG4gIG5pcDA0OiB7XG4gICAgYXN5bmMgZW5jcnlwdChwZWVyOiBzdHJpbmcsIHBsYWludGV4dDogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCduaXAwNC5lbmNyeXB0Jywge3BlZXIsIHBsYWludGV4dH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubm9zdHIuX2NhbGwoJ25pcDA0LmRlY3J5cHQnLCB7cGVlciwgY2lwaGVydGV4dH0pXG4gICAgfVxuICB9LFxuXG4gIG5pcDQ0OiB7XG4gICAgYXN5bmMgZW5jcnlwdChwZWVyOiBzdHJpbmcsIHBsYWludGV4dDogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCduaXA0NC5lbmNyeXB0Jywge3BlZXIsIHBsYWludGV4dH0pXG4gICAgfSxcblxuICAgIGFzeW5jIGRlY3J5cHQocGVlcjogc3RyaW5nLCBjaXBoZXJ0ZXh0OiBzdHJpbmcpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubm9zdHIuX2NhbGwoJ25pcDQ0LmRlY3J5cHQnLCB7cGVlciwgY2lwaGVydGV4dH0pXG4gICAgfVxuICB9LFxuXG4gIHdhbGxldDoge1xuICAgIGFzeW5jIGdldEFjY291bnQoKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCd3YWxsZXQuZ2V0QWNjb3VudCcsIHt9KVxuICAgIH0sXG4gIFxuICAgIGFzeW5jIGdldEJhbGFuY2UoKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCd3YWxsZXQuZ2V0QmFsYW5jZScsIHt9KVxuICAgIH0sXG4gIFxuICAgIGFzeW5jIGdldFV0eG9zKGFtb3VudDogbnVtYmVyKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5vc3RyLl9jYWxsKCd3YWxsZXQuZ2V0VXR4b3MnLCB7IGFtb3VudCB9KVxuICAgIH0sXG4gIFxuICAgIGFzeW5jIHNpZ25Qc2J0KHBzYnQ6IHN0cmluZykge1xuICAgICAgcmV0dXJuIHdpbmRvdy5ub3N0ci5fY2FsbCgnd2FsbGV0LnNpZ25Qc2J0JywgeyBwc2J0IH0pXG4gICAgfVxuICB9LFxuXG4gIF9jYWxsKHR5cGU6IHN0cmluZywgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgbGV0IGlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnNsaWNlKC00KVxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgJyVjW2Zyb3N0Mng6JWMnICtcbiAgICAgICAgaWQgK1xuICAgICAgICAnJWNdJWMgY2FsbGluZyAlYycgK1xuICAgICAgICB0eXBlICtcbiAgICAgICAgJyVjIHdpdGggJWMnICtcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkocGFyYW1zIHx8IHt9KSxcbiAgICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjp3aGl0ZScsXG4gICAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2E5MjcyNycsXG4gICAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2NvbG9yOndoaXRlO2ZvbnQtd2VpZ2h0OmJvbGQnLFxuICAgICAgJ2NvbG9yOmF1dG8nLFxuICAgICAgJ2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6IzA4NTg5ZDtmb250LWZhbWlseTptb25vc3BhY2UnLFxuICAgICAgJ2NvbG9yOmF1dG8nLFxuICAgICAgJ2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6IzkwYjEyZDtmb250LWZhbWlseTptb25vc3BhY2UnXG4gICAgKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLl9yZXF1ZXN0c1tpZF0gPSB7cmVzb2x2ZSwgcmVqZWN0fVxuICAgICAgd2luZG93LnBvc3RNZXNzYWdlKFxuICAgICAgICB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgZXh0OiAnZnJvc3QyeCcsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBwYXJhbXNcbiAgICAgICAgfSxcbiAgICAgICAgJyonXG4gICAgICApXG4gICAgfSlcbiAgfVxufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG1lc3NhZ2UgPT4ge1xuICBpZiAoXG4gICAgIW1lc3NhZ2UuZGF0YSB8fFxuICAgIG1lc3NhZ2UuZGF0YS5yZXNwb25zZSA9PT0gbnVsbCB8fFxuICAgIG1lc3NhZ2UuZGF0YS5yZXNwb25zZSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgbWVzc2FnZS5kYXRhLmV4dCAhPT0gJ2Zyb3N0MngnIHx8XG4gICAgIXdpbmRvdy5ub3N0ci5fcmVxdWVzdHNbbWVzc2FnZS5kYXRhLmlkXVxuICApXG4gICAgcmV0dXJuXG5cbiAgaWYgKG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvcikge1xuICAgIGxldCBlcnJvciA9IG5ldyBFcnJvcignZnJvc3QyeDogJyArIG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvci5tZXNzYWdlKVxuICAgIGVycm9yLnN0YWNrID0gbWVzc2FnZS5kYXRhLnJlc3BvbnNlLmVycm9yLnN0YWNrXG4gICAgd2luZG93Lm5vc3RyLl9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdLnJlamVjdChlcnJvcilcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cubm9zdHIuX3JlcXVlc3RzW21lc3NhZ2UuZGF0YS5pZF0ucmVzb2x2ZShtZXNzYWdlLmRhdGEucmVzcG9uc2UpXG4gIH1cblxuICBjb25zb2xlLmxvZyhcbiAgICAnJWNbZnJvc3QyeDolYycgK1xuICAgICAgbWVzc2FnZS5kYXRhLmlkICtcbiAgICAgICclY10lYyByZXN1bHQ6ICVjJyArXG4gICAgICBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgbWVzc2FnZT8uZGF0YT8ucmVzcG9uc2UgfHwgbWVzc2FnZT8uZGF0YT8ucmVzcG9uc2U/LmVycm9yPy5tZXNzYWdlIHx8IHt9XG4gICAgICApLFxuICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjp3aGl0ZScsXG4gICAgJ2JhY2tncm91bmQtY29sb3I6I2YxYjkxMjtmb250LXdlaWdodDpib2xkO2NvbG9yOiNhOTI3MjcnLFxuICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Y29sb3I6d2hpdGU7Zm9udC13ZWlnaHQ6Ym9sZCcsXG4gICAgJ2NvbG9yOmF1dG8nLFxuICAgICdmb250LXdlaWdodDpib2xkO2NvbG9yOiMwODU4OWQnXG4gIClcblxuICBkZWxldGUgd2luZG93Lm5vc3RyLl9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdXG59KVxuXG4vLyBGaXggdGhlIHJlcGxhY2luZyB2YXJpYWJsZSB0eXBlXG5sZXQgcmVwbGFjaW5nOiBib29sZWFuIHwgbnVsbCA9IG51bGw7XG5cbi8vIEZpeCB0aGUgZXZlbnQgcGFyYW1ldGVyIHR5cGVcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHJlcGxhY2VOb3N0clNjaGVtZUxpbmspXG5hc3luYyBmdW5jdGlvbiByZXBsYWNlTm9zdHJTY2hlbWVMaW5rKGU6IE1vdXNlRXZlbnQpIHtcbiAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEFuY2hvckVsZW1lbnQ7XG4gIGlmICh0YXJnZXQudGFnTmFtZSAhPT0gJ0EnIHx8ICF0YXJnZXQuaHJlZi5zdGFydHNXaXRoKCdub3N0cjonKSkgcmV0dXJuXG4gIFxuICBpZiAocmVwbGFjaW5nID09PSBmYWxzZSkgcmV0dXJuXG5cbiAgbGV0IHJlc3BvbnNlID0gYXdhaXQgd2luZG93Lm5vc3RyLl9jYWxsKCdyZXBsYWNlX3VybCcsIHt1cmw6IHRhcmdldC5ocmVmfSlcblxuICBpZiAocmVzcG9uc2UgPT09IGZhbHNlKSB7XG4gICAgcmVwbGFjaW5nID0gZmFsc2VcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRhcmdldC5ocmVmID0gcmVzcG9uc2Vcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQThCQSxPQUFPLFFBQVE7QUFBQSxJQUNiLFdBQVksQ0FBQztBQUFBLElBQ2IsU0FBWTtBQUFBLElBRVosTUFBTSxlQUFlO0FBQ25CLFVBQUksS0FBSyxZQUFZLE1BQU07QUFDekIsYUFBSyxVQUFVLE1BQU0sS0FBSyxNQUFNLGdCQUFnQixDQUFDLENBQUM7QUFBQSxNQUNwRDtBQUNBLFVBQUksT0FBTyxLQUFLLFlB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
