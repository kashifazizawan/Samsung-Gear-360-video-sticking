/**
 * Spatial Media 360 Metadata Injector for YouTube, Facebook & VR
 * Compliant with Google Spatial Media v1/v2 & Adobe XMP Specification
 */

const SPATIAL_UUID = new Uint8Array([
  0xff, 0xcc, 0x82, 0x63, 0xf8, 0x55, 0x4a, 0x93,
  0x88, 0x14, 0x58, 0x7a, 0x02, 0x52, 0x1f, 0xdd
]);

export function createSphericalXMP(softwareName = 'Samsung SM-C200 AutoStitcher'): string {
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:GSpherical="http://ns.google.com/videos/1.0/spherical/"
    xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
   <GSpherical:Spherical>true</GSpherical:Spherical>
   <GSpherical:Stitched>true</GSpherical:Stitched>
   <GSpherical:StitchingSoftware>${softwareName}</GSpherical:StitchingSoftware>
   <GSpherical:ProjectionType>equirectangular</GSpherical:ProjectionType>
   <GSpherical:SourceCount>2</GSpherical:SourceCount>
   <GSpherical:InitialViewHeadingDegrees>0</GSpherical:InitialViewHeadingDegrees>
   <GSpherical:InitialViewPitchDegrees>0</GSpherical:InitialViewPitchDegrees>
   <GSpherical:InitialViewRollDegrees>0</GSpherical:InitialViewRollDegrees>
   <GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer>
   <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
   <GPano:CroppedAreaImageWidthPixels>3840</GPano:CroppedAreaImageWidthPixels>
   <GPano:CroppedAreaImageHeightPixels>1920</GPano:CroppedAreaImageHeightPixels>
   <GPano:FullPanoWidthPixels>3840</GPano:FullPanoWidthPixels>
   <GPano:FullPanoHeightPixels>1920</GPano:FullPanoHeightPixels>
   <GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>
   <GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Creates a raw MP4 `uuid` atom containing the Spatial 360 XMP packet
 */
export function createSpatialUuidBox(xmpString: string): Uint8Array {
  const encoder = new TextEncoder();
  const xmpBytes = encoder.encode(xmpString);
  const totalLength = 8 + 16 + xmpBytes.length; // 4 (size) + 4 (type "uuid") + 16 (uuid) + payload

  const box = new Uint8Array(totalLength);
  const view = new DataView(box.buffer);

  // Box size (Big-Endian uint32)
  view.setUint32(0, totalLength, false);

  // Box type 'uuid'
  box[4] = 0x75; // 'u'
  box[5] = 0x75; // 'u'
  box[6] = 0x69; // 'i'
  box[7] = 0x64; // 'd'

  // Spatial UUID
  box.set(SPATIAL_UUID, 8);

  // Payload (XMP)
  box.set(xmpBytes, 24);

  return box;
}

/**
 * Injects Google 360 Spatial Media metadata into an MP4 / WebM / Image Blob
 */
export async function injectSpatial360Metadata(blob: Blob, filename = 'stitched_360.mp4'): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const xmp = createSphericalXMP();

  // If this is an MP4 or MOV container (starts with ftyp or moov or contains ISO boxes)
  if (isMp4Container(bytes)) {
    const injected = injectIntoMp4(bytes, xmp);
    return new Blob([injected], { type: blob.type || 'video/mp4' });
  }

  // If this is JPEG image
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const injected = injectIntoJpeg(bytes, xmp);
    return new Blob([injected], { type: 'image/jpeg' });
  }

  // For WebM or raw media stream: append / wrap with spatial header
  const spatialBox = createSpatialUuidBox(xmp);
  const combined = new Uint8Array(bytes.length + spatialBox.length);
  combined.set(bytes, 0);
  combined.set(spatialBox, bytes.length);

  return new Blob([combined], { type: blob.type || 'video/mp4' });
}

function isMp4Container(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  const tag = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  return tag === 'ftyp' || tag === 'moov' || tag === 'mdat';
}

function injectIntoMp4(bytes: Uint8Array, xmp: string): Uint8Array {
  const uuidBox = createSpatialUuidBox(xmp);
  
  // Find 'moov' box to inject inside or right after 'ftyp'
  let offset = 0;
  let moovOffset = -1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  while (offset + 8 <= bytes.length) {
    const boxSize = view.getUint32(offset, false);
    if (boxSize < 8 || offset + boxSize > bytes.length) {
      break;
    }
    const boxType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (boxType === 'moov') {
      moovOffset = offset;
      break;
    }
    offset += boxSize;
  }

  if (moovOffset !== -1) {
    // Insert UUID box inside/after MOOV
    const result = new Uint8Array(bytes.length + uuidBox.length);
    result.set(bytes.subarray(0, moovOffset + 8), 0);
    result.set(uuidBox, moovOffset + 8);
    result.set(bytes.subarray(moovOffset + 8), moovOffset + 8 + uuidBox.length);
    
    // Update moov box size
    const newMoovView = new DataView(result.buffer, result.byteOffset, result.byteLength);
    const oldMoovSize = view.getUint32(moovOffset, false);
    newMoovView.setUint32(moovOffset, oldMoovSize + uuidBox.length, false);

    return result;
  }

  // Fallback: prepend after ftyp or at beginning
  const result = new Uint8Array(bytes.length + uuidBox.length);
  result.set(uuidBox, 0);
  result.set(bytes, uuidBox.length);
  return result;
}

function injectIntoJpeg(bytes: Uint8Array, xmp: string): Uint8Array {
  // JPEG APP1 XMP marker: 0xFF 0xE1 [2-byte len] "http://ns.adobe.com/xap/1.0/\0" [XMP]
  const encoder = new TextEncoder();
  const header = encoder.encode("http://ns.adobe.com/xap/1.0/\0");
  const xmpBytes = encoder.encode(xmp);
  const payloadLength = header.length + xmpBytes.length + 2;

  const app1 = new Uint8Array(payloadLength + 2);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1[2] = (payloadLength >> 8) & 0xff;
  app1[3] = payloadLength & 0xff;
  app1.set(header, 4);
  app1.set(xmpBytes, 4 + header.length);

  // Insert right after SOI (0xFF 0xD8)
  const result = new Uint8Array(bytes.length + app1.length);
  result.set(bytes.subarray(0, 2), 0);
  result.set(app1, 2);
  result.set(bytes.subarray(2), 2 + app1.length);
  return result;
}
