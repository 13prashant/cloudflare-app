import { NextResponse } from "next/server";
import Jimp from "jimp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize the S3 client
export const r2 = new S3Client({
  region: "auto",
  //   endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// Function to upload to S3
export async function uploadToS3({ buffer, key, contentType }) {
  try {
    // Use the promise-based send method
    const result = await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload to S3");
  }
}

// The main POST handler
export async function POST(request) {
  try {
    // Parse form data
    const formData = await request.formData();
    const filename = formData.get("file-name");
    const category = formData.get("folder");
    const imageFile = formData.get("image");

    // Check for missing image file
    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is missing" },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Specify desired image size
    const desiredImageSize = { width: 500, height: 500 };

    // Use Jimp for image processing
    const editedImage = await Jimp.read(imageBuffer);
    await editedImage.cover(desiredImageSize.width, desiredImageSize.height);
    const editedImageBuffer = await editedImage.getBufferAsync(Jimp.AUTO);

    // Upload edited image to S3
    const imageUrl = await uploadToS3({
      buffer: editedImageBuffer,
      key: `${category}/${filename}`,
      contentType: imageFile.type,
    });

    // Return success response
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Error in POST handler:", err);

    // Return error response
    return NextResponse.json(
      {
        error: "Internal server error",
        errorMessage: err.message || "Unknown error",
        errorStack: err.stack || "No error stack available",
      },
      { status: 500 }
    );
  }
}

/**
S3 Upload Error: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the clientMay 14, 11:25:05 AM: 1618378a ERROR at ClientRequest.setHeader (node:_http_outgoing:659:11)May 14, 11:25:05 AM: 1618378a ERROR at addHeaders (file:///var/task/___netlify-bootstrap.mjs:1890:13)May 14, 11:25:05 AM: 1618378a ERROR at patchedRequest (file:///var/task/___netlify-bootstrap.mjs:1916:7)May 14, 11:25:05 AM: 1618378a ERROR at /var/task/node_modules/@smithy/node-http-handler/dist-cjs/index.js:297:19May 14, 11:25:05 AM: 1618378a ERROR at new Promise (<anonymous>)May 14, 11:25:05 AM: 1618378a ERROR at NodeHttpHandler.handle (/var/task/nodemodules/@smithy/node-http-handler/dist-cjs/index.js:245:12)May 14, 11:25:05 AM: 1618378a ERROR at async /var/task/node_modules/@aws-sdk/middleware-flexible-checksums/dist-cjs/index.js:258:18May 14, 11:25:05 AM: 1618378a ERROR at async /var/task/node_modules/@smithy/middleware-serde/dist-cjs/index.js:33:24 {May 14, 11:25:05 AM: 1618378a ERROR code: 'ERR_HTTP_HEADERS_SENT',May 14, 11:25:05 AM: 1618378a ERROR '$metadata': { attempts: 1, totalRetryDelay: 0 }May 14, 11:25:05 AM: 1618378a ERROR }
 */
