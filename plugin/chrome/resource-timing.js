// Script de contenu GreenScore : lit dans la page la taille RÉELLEMENT transférée de
// chaque ressource (API Resource Timing, PerformanceResourceTiming.transferSize) et
// l'envoie à l'arrière-plan. Il complète Content-Length quand celui-ci est absent
// (réponses « chunked », documents HTML, etc.). CDCT §4.4.
//
// transferSize vaut 0 pour une ressource servie depuis le cache, ou pour une ressource
// d'une autre origine sans en-tête Timing-Allow-Origin : ces entrées ne sont pas envoyées.
(function () {
  "use strict";

  const api = typeof browser !== "undefined" ? browser : chrome;
  const FLUSH_DELAY_MS = 500;
  let pending = [];
  let timer = null;

  function flush() {
    timer = null;
    if (pending.length === 0) return;
    const entries = pending;
    pending = [];
    try {
      const sent = api.runtime.sendMessage({ type: "resourceTiming", entries });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    } catch (_) {
      // Extension rechargée ou arrière-plan indisponible : mesure perdue pour ces entrées.
    }
  }

  function collect(list) {
    for (const entry of list.getEntries()) {
      if (entry.transferSize > 0) {
        pending.push({ url: entry.name, transferSize: entry.transferSize });
      }
    }
    if (pending.length > 0 && timer === null) timer = setTimeout(flush, FLUSH_DELAY_MS);
  }

  try {
    new PerformanceObserver(collect).observe({ type: "navigation", buffered: true });
    new PerformanceObserver(collect).observe({ type: "resource", buffered: true });
  } catch (_) {
    // Navigateur sans PerformanceObserver : seule la mesure par Content-Length reste.
  }

  addEventListener("pagehide", flush);
})();
