function extractGoogleDriveFileId(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const match =
    trimmed.match(/\/file\/d\/([^/]+)/) ||
    trimmed.match(/[?&]id=([^&]+)/) ||
    trimmed.match(/\/d\/([^/]+)/);

  return match?.[1] || null;
}

function extractGoogleDriveResourceKey(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const queryMatch = trimmed.match(/[?&]resourcekey=([^&]+)/i);
  return queryMatch?.[1] || null;
}

function buildDriveQuery(fileId: string, resourceKey?: string | null) {
  return resourceKey ? `id=${fileId}&resourcekey=${resourceKey}` : `id=${fileId}`;
}

export function getGoogleDriveCandidateUrls(rawUrl: string) {
  const trimmed = rawUrl.trim();
  const fileId = extractGoogleDriveFileId(trimmed);
  const resourceKey = extractGoogleDriveResourceKey(trimmed);

  if (!fileId) {
    return trimmed ? [trimmed] : [];
  }

  const queryString = buildDriveQuery(fileId, resourceKey);

  return [
    `https://drive.google.com/thumbnail?${queryString}&sz=w4000`,
    `https://drive.google.com/uc?export=download&${queryString}`,
    `https://drive.google.com/uc?export=view&${queryString}`,
    `https://drive.usercontent.google.com/download?${queryString}&export=view&authuser=0`,
    `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
  ];
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to convert image blob to data URL.'));
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read imported image.'));
    reader.readAsDataURL(blob);
  });
}

export async function importGoogleDriveImageAsDataUrl(rawUrl: string) {
  const candidates = getGoogleDriveCandidateUrls(rawUrl);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        continue;
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        continue;
      }

      const dataUrl = await blobToDataUrl(blob);
      return {
        dataUrl,
        fetchedUrl: candidate,
      };
    } catch (error) {
      console.warn('Google Drive image import attempt failed:', candidate, error);
    }
  }

  throw new Error('Unable to import this Google Drive image. Make sure the file is public.');
}
