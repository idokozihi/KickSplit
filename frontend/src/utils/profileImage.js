export const PROFILE_IMAGE_MAX_DIMENSION = 512;
export const PROFILE_IMAGE_QUALITY = 0.8;
export const GROUP_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const GROUP_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ProfileImageError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "ProfileImageError";
    this.code = code;
    this.cause = cause;
  }
}

function unreadableImageError(cause) {
  return new ProfileImageError(
    "unreadable",
    "This image format is not supported by your browser, or the image could not be read. Try another photo.",
    cause,
  );
}

function processingImageError(cause) {
  return new ProfileImageError(
    "processing",
    "We could not process that photo. Please try another image.",
    cause,
  );
}

async function decodeWithImageElement(file, browser) {
  if (
    typeof browser.Image !== "function" ||
    typeof browser.URL?.createObjectURL !== "function"
  ) {
    throw new Error("Image element decoding is unavailable.");
  }

  const objectUrl = browser.URL.createObjectURL(file);
  const image = new browser.Image();
  image.decoding = "async";

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("The browser could not decode the image."));
      image.src = objectUrl;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("The decoded image has no dimensions.");
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => browser.URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    browser.URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function decodeImage(file, browser) {
  let bitmapError;

  if (typeof browser.createImageBitmap === "function") {
    try {
      const bitmap = await browser.createImageBitmap(file, { imageOrientation: "from-image" });
      if (bitmap.width && bitmap.height) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => bitmap.close?.(),
        };
      }
      bitmap.close?.();
      bitmapError = new Error("The decoded image has no dimensions.");
    } catch (error) {
      bitmapError = error;
    }
  }

  try {
    return await decodeWithImageElement(file, browser);
  } catch (error) {
    throw unreadableImageError(error || bitmapError);
  }
}

function scaledDimensions(width, height, maxDimension) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function processProfileImage(
  file,
  {
    maxDimension = PROFILE_IMAGE_MAX_DIMENSION,
    quality = PROFILE_IMAGE_QUALITY,
    browser = globalThis,
  } = {},
) {
  const mimeType = typeof file?.type === "string" ? file.type.toLowerCase() : "";
  if (
    !file ||
    (mimeType && !mimeType.startsWith("image/") && mimeType !== "application/octet-stream")
  ) {
    throw new ProfileImageError(
      "unsupported",
      "Please choose an image from your photo library.",
    );
  }

  const decoded = await decodeImage(file, browser);

  try {
    const canvas = browser.document?.createElement("canvas");
    if (!canvas) throw new Error("Canvas is unavailable.");

    const size = scaledDimensions(decoded.width, decoded.height, maxDimension);
    canvas.width = size.width;
    canvas.height = size.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");

    context.fillStyle = "#fff";
    context.fillRect(0, 0, size.width, size.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, size.width, size.height);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (!dataUrl.startsWith("data:image/jpeg")) {
      throw new Error("The browser could not encode the processed image.");
    }
    return dataUrl;
  } catch (error) {
    throw processingImageError(error);
  } finally {
    decoded.close();
  }
}

export async function processGroupImage(file, options) {
  const mimeType = typeof file?.type === "string" ? file.type.toLowerCase() : "";
  if (
    !file
    || !GROUP_IMAGE_TYPES.includes(mimeType)
    || (Number.isFinite(file.size) && file.size > GROUP_IMAGE_MAX_BYTES)
  ) {
    throw new ProfileImageError(
      "unsupported",
      "Choose a JPG, PNG or WebP image under 3 MB.",
    );
  }
  return processProfileImage(file, options);
}
