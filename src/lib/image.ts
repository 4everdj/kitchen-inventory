
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<File> {
  const image = new Image();

  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error('Unable to read the selected image.'));
      image.src = objectUrl;
    });

    const scale = Math.min(
      1,
      maxWidth / image.naturalWidth
    );

    const width = Math.round(
      image.naturalWidth * scale
    );

    const height = Math.round(
      image.naturalHeight * scale
    );

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to process the image.');
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob = await new Promise<Blob | null>(
      (resolve) =>
        canvas.toBlob(
          resolve,
          'image/webp',
          quality
        )
    );

    if (!blob) {
      throw new Error('Unable to compress the image.');
    }

    return new File(
      [blob],
      `${file.name.replace(/\.[^/.]+$/, '')}.webp`,
      {
        type: 'image/webp',
        lastModified: Date.now(),
      }
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

