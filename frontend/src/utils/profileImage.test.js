import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROFILE_IMAGE_MAX_DIMENSION,
  PROFILE_IMAGE_QUALITY,
  ProfileImageError,
  processProfileImage,
} from "./profileImage.js";

function imageBrowser({ width = 4032, height = 3024, context = {} } = {}) {
  const calls = [];
  const bitmap = { width, height, close: () => calls.push(["close"]) };
  const drawingContext = {
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
    ...context,
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => drawingContext,
    toDataURL: (...args) => {
      calls.push(["toDataURL", ...args]);
      return "data:image/jpeg;base64,processed";
    },
  };
  const browser = {
    createImageBitmap: async () => bitmap,
    document: { createElement: (tag) => tag === "canvas" ? canvas : null },
  };
  return { browser, bitmap, canvas, calls };
}

test("profile photos are scaled to 512px and encoded as a compressed JPEG", async () => {
  const { browser, bitmap, canvas, calls } = imageBrowser();

  const result = await processProfileImage({ type: "image/heic" }, { browser });

  assert.equal(result, "data:image/jpeg;base64,processed");
  assert.equal(canvas.width, PROFILE_IMAGE_MAX_DIMENSION);
  assert.equal(canvas.height, 384);
  assert.deepEqual(calls.find(([name]) => name === "drawImage"), [
    "drawImage", bitmap, 0, 0, 512, 384,
  ]);
  assert.deepEqual(calls.find(([name]) => name === "toDataURL"), [
    "toDataURL", "image/jpeg", PROFILE_IMAGE_QUALITY,
  ]);
  assert.deepEqual(calls.at(-1), ["close"]);
});

test("small photos keep their dimensions instead of being enlarged", async () => {
  const { browser, canvas } = imageBrowser({ width: 240, height: 320 });

  await processProfileImage({ type: "image/png" }, { browser });

  assert.equal(canvas.width, 240);
  assert.equal(canvas.height, 320);
});

test("image element decoding is used when createImageBitmap cannot open the photo", async () => {
  const { browser, canvas } = imageBrowser();
  let revokedUrl = "";
  browser.createImageBitmap = async () => { throw new Error("Codec unavailable"); };
  browser.URL = {
    createObjectURL: () => "blob:phone-photo",
    revokeObjectURL: (url) => { revokedUrl = url; },
  };
  browser.Image = class {
    naturalWidth = 3024;
    naturalHeight = 4032;
    set src(value) {
      this.currentSrc = value;
      queueMicrotask(() => this.onload());
    }
  };

  await processProfileImage({ type: "application/octet-stream" }, { browser });

  assert.equal(canvas.width, 384);
  assert.equal(canvas.height, 512);
  assert.equal(revokedUrl, "blob:phone-photo");
});

test("non-images and browser decode failures return clear validation errors", async () => {
  await assert.rejects(
    processProfileImage({ type: "application/pdf" }),
    (error) => error instanceof ProfileImageError && error.code === "unsupported",
  );

  const browser = {
    createImageBitmap: async () => { throw new Error("Unsupported codec"); },
  };
  await assert.rejects(
    processProfileImage({ type: "image/heic" }, { browser }),
    (error) => error instanceof ProfileImageError && error.code === "unreadable",
  );
});

test("canvas failures are reported separately from unreadable images", async () => {
  const { browser } = imageBrowser();
  browser.document.createElement = () => ({ getContext: () => null });

  await assert.rejects(
    processProfileImage({ type: "image/jpeg" }, { browser }),
    (error) => error instanceof ProfileImageError && error.code === "processing",
  );
});
