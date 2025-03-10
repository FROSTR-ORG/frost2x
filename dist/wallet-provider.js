"use strict";
(() => {
  // src/providers/wallet-provider.ts
  self.btc_wallet = {
    _requests: {},
    _account: null,
    async getAccount() {
      if (this._account === null) {
        this._account = await this._call("wallet.getAccount", {});
      }
      if (typeof this._account !== "string") {
        throw new Error("Failed to get wallet account");
      }
      return this._account;
    },
    async getBalance() {
      return self.btc_wallet._call("wallet.getBalance", {});
    },
    async getUtxos(amount) {
      return self.btc_wallet._call("wallet.getUtxos", { amount });
    },
    async signPsbt(psbt, manifest) {
      return self.btc_wallet._call("wallet.signPsbt", { psbt, manifest });
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
    if (!message.data || message.data.response === null || message.data.response === void 0 || message.data.ext !== "frost2x" || !self.btc_wallet._requests[message.data.id])
      return;
    if (message.data.response.error) {
      let error = new Error("frost2x: " + message.data.response.error.message);
      error.stack = message.data.response.error.stack;
      self.btc_wallet._requests[message.data.id].reject(error);
    } else {
      self.btc_wallet._requests[message.data.id].resolve(message.data.response);
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
    delete self.btc_wallet._requests[message.data.id];
  });
  var replacing = null;
  document.addEventListener("mousedown", replaceNostrSchemeLink);
  async function replaceNostrSchemeLink(e) {
    const target = e.target;
    if (target.tagName !== "A" || !target.href.startsWith("psbt:")) return;
    if (replacing === false) return;
    let response = await self.btc_wallet._call("replace_url", { url: target.href });
    if (response === false) {
      replacing = false;
      return;
    }
    target.href = response;
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3Byb3ZpZGVycy93YWxsZXQtcHJvdmlkZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgV2FsbGV0VXR4bywgV2FsbGV0U2lnbk1haW5pZmVzdCB9IGZyb20gJy4uL3R5cGVzL2luZGV4LmpzJ1xuXG4vLyBGaXJzdCBkZWNsYXJlIHRoZSB3aW5kb3cgYnRjIHByb3BlcnR5IHR5cGVcbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgYnRjX3dhbGxldDoge1xuICAgICAgX3JlcXVlc3RzOiBSZWNvcmQ8c3RyaW5nLCB7IHJlc29sdmU6ICh2YWx1ZTogYW55KSA9PiB2b2lkLCByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQgfT47XG4gICAgICBfYWNjb3VudDogc3RyaW5nIHwgbnVsbDtcbiAgICAgIGdldEFjY291bnQoKTogUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgZ2V0QmFsYW5jZSgpOiBQcm9taXNlPG51bWJlcj47XG4gICAgICBnZXRVdHhvcyhhbW91bnQ6IG51bWJlcik6IFByb21pc2U8V2FsbGV0VXR4b1tdPjtcbiAgICAgIHNpZ25Qc2J0KHBzYnQ6IHN0cmluZywgbWFuaWZlc3Q6IFdhbGxldFNpZ25NYWluaWZlc3QpOiBQcm9taXNlPHN0cmluZz47XG4gICAgICBfY2FsbCh0eXBlOiBzdHJpbmcsIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8YW55PjtcbiAgICB9XG4gIH1cbn1cblxud2luZG93LmJ0Y193YWxsZXQgPSB7XG4gIF9yZXF1ZXN0cyA6IHt9LFxuICBfYWNjb3VudCAgOiBudWxsLFxuXG4gIGFzeW5jIGdldEFjY291bnQoKSB7XG4gICAgaWYgKHRoaXMuX2FjY291bnQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2FjY291bnQgPSBhd2FpdCB0aGlzLl9jYWxsKCd3YWxsZXQuZ2V0QWNjb3VudCcsIHt9KVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMuX2FjY291bnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBnZXQgd2FsbGV0IGFjY291bnQnKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYWNjb3VudFxuICB9LFxuXG4gIGFzeW5jIGdldEJhbGFuY2UoKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5idGNfd2FsbGV0Ll9jYWxsKCd3YWxsZXQuZ2V0QmFsYW5jZScsIHt9KVxuICB9LFxuXG4gIGFzeW5jIGdldFV0eG9zKGFtb3VudDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5idGNfd2FsbGV0Ll9jYWxsKCd3YWxsZXQuZ2V0VXR4b3MnLCB7IGFtb3VudCB9KVxuICB9LFxuXG4gIGFzeW5jIHNpZ25Qc2J0KHBzYnQ6IHN0cmluZywgbWFuaWZlc3Q6IFdhbGxldFNpZ25NYWluaWZlc3QpIHtcbiAgICByZXR1cm4gd2luZG93LmJ0Y193YWxsZXQuX2NhbGwoJ3dhbGxldC5zaWduUHNidCcsIHsgcHNidCwgbWFuaWZlc3QgfSlcbiAgfSxcblxuICBfY2FsbCh0eXBlOiBzdHJpbmcsIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgIGxldCBpZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zbGljZSgtNClcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICclY1tmcm9zdDJ4OiVjJyArXG4gICAgICAgIGlkICtcbiAgICAgICAgJyVjXSVjIGNhbGxpbmcgJWMnICtcbiAgICAgICAgdHlwZSArXG4gICAgICAgICclYyB3aXRoICVjJyArXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHBhcmFtcyB8fCB7fSksXG4gICAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6d2hpdGUnLFxuICAgICAgJ2JhY2tncm91bmQtY29sb3I6I2YxYjkxMjtmb250LXdlaWdodDpib2xkO2NvbG9yOiNhOTI3MjcnLFxuICAgICAgJ2JhY2tncm91bmQtY29sb3I6I2YxYjkxMjtjb2xvcjp3aGl0ZTtmb250LXdlaWdodDpib2xkJyxcbiAgICAgICdjb2xvcjphdXRvJyxcbiAgICAgICdmb250LXdlaWdodDpib2xkO2NvbG9yOiMwODU4OWQ7Zm9udC1mYW1pbHk6bW9ub3NwYWNlJyxcbiAgICAgICdjb2xvcjphdXRvJyxcbiAgICAgICdmb250LXdlaWdodDpib2xkO2NvbG9yOiM5MGIxMmQ7Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xuICAgIClcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fcmVxdWVzdHNbaWRdID0ge3Jlc29sdmUsIHJlamVjdH1cbiAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShcbiAgICAgICAge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGV4dDogJ2Zyb3N0MngnLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgcGFyYW1zXG4gICAgICAgIH0sXG4gICAgICAgICcqJ1xuICAgICAgKVxuICAgIH0pXG4gIH1cbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBtZXNzYWdlID0+IHtcbiAgaWYgKFxuICAgICFtZXNzYWdlLmRhdGEgfHxcbiAgICBtZXNzYWdlLmRhdGEucmVzcG9uc2UgPT09IG51bGwgfHxcbiAgICBtZXNzYWdlLmRhdGEucmVzcG9uc2UgPT09IHVuZGVmaW5lZCB8fFxuICAgIG1lc3NhZ2UuZGF0YS5leHQgIT09ICdmcm9zdDJ4JyB8fFxuICAgICF3aW5kb3cuYnRjX3dhbGxldC5fcmVxdWVzdHNbbWVzc2FnZS5kYXRhLmlkXVxuICApXG4gICAgcmV0dXJuXG5cbiAgaWYgKG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvcikge1xuICAgIGxldCBlcnJvciA9IG5ldyBFcnJvcignZnJvc3QyeDogJyArIG1lc3NhZ2UuZGF0YS5yZXNwb25zZS5lcnJvci5tZXNzYWdlKVxuICAgIGVycm9yLnN0YWNrID0gbWVzc2FnZS5kYXRhLnJlc3BvbnNlLmVycm9yLnN0YWNrXG4gICAgd2luZG93LmJ0Y193YWxsZXQuX3JlcXVlc3RzW21lc3NhZ2UuZGF0YS5pZF0ucmVqZWN0KGVycm9yKVxuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5idGNfd2FsbGV0Ll9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdLnJlc29sdmUobWVzc2FnZS5kYXRhLnJlc3BvbnNlKVxuICB9XG5cbiAgY29uc29sZS5sb2coXG4gICAgJyVjW2Zyb3N0Mng6JWMnICtcbiAgICAgIG1lc3NhZ2UuZGF0YS5pZCArXG4gICAgICAnJWNdJWMgcmVzdWx0OiAlYycgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIG1lc3NhZ2U/LmRhdGE/LnJlc3BvbnNlIHx8IG1lc3NhZ2U/LmRhdGE/LnJlc3BvbnNlPy5lcnJvcj8ubWVzc2FnZSB8fCB7fVxuICAgICAgKSxcbiAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6d2hpdGUnLFxuICAgICdiYWNrZ3JvdW5kLWNvbG9yOiNmMWI5MTI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjojYTkyNzI3JyxcbiAgICAnYmFja2dyb3VuZC1jb2xvcjojZjFiOTEyO2NvbG9yOndoaXRlO2ZvbnQtd2VpZ2h0OmJvbGQnLFxuICAgICdjb2xvcjphdXRvJyxcbiAgICAnZm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjojMDg1ODlkJ1xuICApXG5cbiAgZGVsZXRlIHdpbmRvdy5idGNfd2FsbGV0Ll9yZXF1ZXN0c1ttZXNzYWdlLmRhdGEuaWRdXG59KVxuXG4vLyBGaXggdGhlIHJlcGxhY2luZyB2YXJpYWJsZSB0eXBlXG5sZXQgcmVwbGFjaW5nOiBib29sZWFuIHwgbnVsbCA9IG51bGw7XG5cbi8vIEZpeCB0aGUgZXZlbnQgcGFyYW1ldGVyIHR5cGVcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHJlcGxhY2VOb3N0clNjaGVtZUxpbmspXG5hc3luYyBmdW5jdGlvbiByZXBsYWNlTm9zdHJTY2hlbWVMaW5rKGU6IE1vdXNlRXZlbnQpIHtcbiAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEFuY2hvckVsZW1lbnQ7XG4gIGlmICh0YXJnZXQudGFnTmFtZSAhPT0gJ0EnIHx8ICF0YXJnZXQuaHJlZi5zdGFydHNXaXRoKCdwc2J0OicpKSByZXR1cm5cbiAgXG4gIGlmIChyZXBsYWNpbmcgPT09IGZhbHNlKSByZXR1cm5cblxuICBsZXQgcmVzcG9uc2UgPSBhd2FpdCB3aW5kb3cuYnRjX3dhbGxldC5fY2FsbCgncmVwbGFjZV91cmwnLCB7dXJsOiB0YXJnZXQuaHJlZn0pXG5cbiAgaWYgKHJlc3BvbnNlID09PSBmYWxzZSkge1xuICAgIHJlcGxhY2luZyA9IGZhbHNlXG4gICAgcmV0dXJuXG4gIH1cblxuICB0YXJnZXQuaHJlZiA9IHJlc3BvbnNlXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFpQkEsT0FBTyxhQUFhO0FBQUEsSUFDbEIsV0FBWSxDQUFDO0FBQUEsSUFDYixVQUFZO0FBQUEsSUFFWixNQUFNLGFBQWE7QUFDakIsVUFBSSxLQUFLLGFBQWEsTUFBTTtBQUMxQixhQUFLLFdBQVcsTUFBTSxLQUFLLE1BQU0scUJBQXFCLENBQUMsQ0FBQztBQUFBLE1BQzFEO0FBQ0EsVUFBSSxPQUFPLEtBQUssYUFBYSxVQUFVO0FBQ3JDLGNBQU0sSUFBSSxNQUFNLDhCQUE4QjtBQUFBLE1BQ2hEO0FBQ0EsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLElBRUEsTUFBTSxhQUFhO0FBQ2pCLGFBQU8sS0FBTyxXQUFXLE1BQU0scUJBQXFCLENBQUMsQ0FBQztBQUFBLElBQ3hEO0FBQUEsSUFFQSxNQUFNLFNBQVMsUUFBZ0I7QUFDN0IsYUFBTyxLQUFPLFdBQVcsTUFBTSxtQkFBbUIsRUFBRSxPQUFPLENBQUM7QUFBQSxJQUM5RDtBQUFBLElBRUEsTUFBTSxTQUFTLE1BQWMsVUFBK0I7QUFDMUQsYUFBTyxLQUFPLFdBQVcsTUFBTSxtQkFBbUIsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUFBLElBQ3RFO0FBQUEsSUFFQSxNQUFNLE1BQWMsUUFBNkI7QUFDL0MsVUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFDMUMsY0FBUTtBQUFBLFFBQ04sa0JBQ0UsS0FDQSxxQkFDQSxPQUNBLGVBQ0EsS0FBSyxVQUFVLFVBQVUsQ0FBQyxDQUFDO0FBQUEsUUFDN0I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQ0EsYUFBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDdEMsYUFBSyxVQUFVLEVBQUUsSUFBSSxFQUFDLFNBQVMsT0FBTTtBQUNyQyxhQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0U7QUFBQSxZQUNBLEtBQUs7QUFBQSxZQUNMO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBRUEsT0FBTyxpQkFBaUIsV0FBVyxhQUFXO0FBQzVDLFFBQ0UsQ0FBQyxRQUFRLFFBQ1QsUUFBUSxLQUFLLGFBQWEsUUFDMUIsUUFBUSxLQUFLLGFBQWEsVUFDMUIsUUFBUSxLQUFLLFFBQVEsYUFDckIsQ0FBQyxLQUFPLFdBQVcsVUFBVSxRQUFRLEtBQUssRUFBRTtBQUU1QztBQUVGLFFBQUksUUFBUSxLQUFLLFNBQVMsT0FBTztBQUMvQixVQUFJLFFBQVEsSUFBSSxNQUFNLGNBQWMsUUFBUSxLQUFLLFNBQVMsTUFBTSxPQUFPO0FBQ3ZFLFlBQU0sUUFBUSxRQUFRLEtBQUssU0FBUyxNQUFNO0FBQzFDLFdBQU8sV0FBVyxVQUFVLFFBQVEsS0FBSyxFQUFFLEVBQUUsT0FBTyxLQUFLO0FBQUEsSUFDM0QsT0FBTztBQUNMLFdBQU8sV0FBVyxVQUFVLFFBQVEsS0FBSyxFQUFFLEVBQUUsUUFBUSxRQUFRLEtBQUssUUFBUTtBQUFBLElBQzVFO0FBRUEsWUFBUTtBQUFBLE1BQ04sa0JBQ0UsUUFBUSxLQUFLLEtBQ2IscUJBQ0EsS0FBSztBQUFBLFFBQ0gsU0FBUyxNQUFNLFlBQVksU0FBUyxNQUFNLFVBQVUsT0FBTyxXQUFXLENBQUM7QUFBQSxNQUN6RTtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUVBLFdBQU8sS0FBTyxXQUFXLFVBQVUsUUFBUSxLQUFLLEVBQUU7QUFBQSxFQUNwRCxDQUFDO0FBR0QsTUFBSSxZQUE0QjtBQUdoQyxXQUFTLGlCQUFpQixhQUFhLHNCQUFzQjtBQUM3RCxpQkFBZSx1QkFBdUIsR0FBZTtBQUNuRCxVQUFNLFNBQVMsRUFBRTtBQUNqQixRQUFJLE9BQU8sWUFBWSxPQUFPLENBQUMsT0FBTyxLQUFLLFdBQVcsT0FBTyxFQUFHO0FBRWhFLFFBQUksY0FBYyxNQUFPO0FBRXpCLFFBQUksV0FBVyxNQUFNLEtBQU8sV0FBVyxNQUFNLGVBQWUsRUFBQyxLQUFLLE9BQU8sS0FBSSxDQUFDO0FBRTlFLFFBQUksYUFBYSxPQUFPO0FBQ3RCLGtCQUFZO0FBQ1o7QUFBQSxJQUNGO0FBRUEsV0FBTyxPQUFPO0FBQUEsRUFDaEI7IiwKICAibmFtZXMiOiBbXQp9Cg==
