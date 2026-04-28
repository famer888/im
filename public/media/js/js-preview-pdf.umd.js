!function (root, factory) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    (root = typeof globalThis !== "undefined" ? globalThis : root || self).jsPreviewPdf = factory();
  }
}(this, function () {
  "use strict";

  function normalizeSource(source) {
    if (!source) return source;
    if (source instanceof Uint8Array) return source;
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    return source;
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function PdfPreview(container, options, requestOptions) {
    this.container = container;
    this.options = options || {};
    this.requestOptions = requestOptions || {};
    this.pdfDocument = null;
    this._destroyed = false;
  }

  PdfPreview.prototype._getLib = function () {
    if (!window.pdfjsLib) {
      throw new Error("window.pdfjsLib is missing. Ensure pdf.min.js is loaded before js-preview-pdf.umd.js.");
    }
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "js/pdf.worker.min.js";
    }
    return window.pdfjsLib;
  };

  PdfPreview.prototype._buildLayout = function () {
    clearNode(this.container);

    var root = document.createElement("div");
    root.className = "js-preview-pdf-root";
    root.style.height = "100%";
    root.style.overflow = "auto";
    root.style.background = "#666";
    root.style.padding = "16px 0";
    root.style.boxSizing = "border-box";
    root.style.textAlign = "center";

    this.container.appendChild(root);
    this._root = root;
  };

  PdfPreview.prototype._getPageScale = function (page, targetWidth) {
    var viewport = page.getViewport({ scale: 1 });
    if (!targetWidth || targetWidth <= 0) return 1;
    return targetWidth / viewport.width;
  };

  PdfPreview.prototype.preview = async function (source) {
    if (!source) throw new Error("PDF source is empty");
    if (this._destroyed) throw new Error("PDF previewer has been destroyed");

    var pdfjsLib = this._getLib();
    this._buildLayout();

    if (this.pdfDocument) {
      try {
        await this.pdfDocument.destroy();
      } catch (e) {
        // Ignore destroy errors from previous document.
      }
      this.pdfDocument = null;
    }

    var loadingTask = pdfjsLib.getDocument({
      url: normalizeSource(source),
      httpHeaders: this.requestOptions && this.requestOptions.headers,
      withCredentials: this.requestOptions && this.requestOptions.withCredentials
    });

    this.pdfDocument = await loadingTask.promise;

    var containerWidth = this._root.clientWidth || this.container.clientWidth || 800;
    var pageTargetWidth = Math.max(containerWidth - 32, 200);
    var gap = typeof this.options.gap === "number" ? this.options.gap : 12;

    for (var pageNumber = 1; pageNumber <= this.pdfDocument.numPages; pageNumber += 1) {
      if (this._destroyed) return;

      var page = await this.pdfDocument.getPage(pageNumber);
      var scale = this._getPageScale(page, pageTargetWidth);
      var viewport = page.getViewport({ scale: scale });
      var deviceScale = window.devicePixelRatio > 1 ? window.devicePixelRatio : 1;

      var canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.margin = "0 auto " + gap + "px";
      canvas.style.background = "#fff";
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";
      canvas.width = Math.floor(viewport.width * deviceScale);
      canvas.height = Math.floor(viewport.height * deviceScale);

      var context = canvas.getContext("2d", { alpha: false });
      var transform = deviceScale !== 1 ? [deviceScale, 0, 0, deviceScale, 0, 0] : null;

      this._root.appendChild(canvas);
      await page.render({
        canvasContext: context,
        viewport: viewport,
        transform: transform
      }).promise;
    }

    if (typeof this.options.onRendered === "function") {
      this.options.onRendered();
    }
  };

  PdfPreview.prototype.destroy = async function () {
    this._destroyed = true;
    if (this.pdfDocument) {
      try {
        await this.pdfDocument.destroy();
      } catch (e) {
        // Ignore.
      }
      this.pdfDocument = null;
    }
    clearNode(this.container);
  };

  return {
    init: function (container, options, requestOptions) {
      return new PdfPreview(container, options, requestOptions);
    }
  };
});
