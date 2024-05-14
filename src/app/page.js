"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [uploadingImage, setUploadingImage] = useState(false);

  const onCropSubmit = async () => {
    setUploadingImage(true); // Show loading indicator

    try {
      const img = await fetch("https://picsum.photos/200");
      const croppedImageBlob = await img.blob();

      // const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      const fileExt = "jpeg"; // Assuming cropped image is in JPEG format
      const photo = `profile-img-${"params?.id"}.${fileExt}`;
      const croppedFile = new File([croppedImageBlob], photo, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("image", croppedFile);
      formData.append("file-name", photo);
      formData.append("folder", "profile"); // Assuming you're organizing uploaded images into folders

      const response = await fetch("/api/upload-profile-pic", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload cropped image.");
      }
      const result = await response.json();

      const newImageUrl = `${
        result.imageUrl
      }?timestamp=${new Date().getTime()}`;
      await updateProfilePicture(newImageUrl);
      setImagePreview(newImageUrl); // Update image preview with the new image URL

      setShowCropper(false); // Hide cropper
    } catch (error) {
      console.error("Error uploading cropped image:", error);
      alert(error.message);
    } finally {
      setUploadingImage(false); // Hide loading indicator
    }
  };

  return (
    <main className={styles.main}>
      <button onClick={onCropSubmit}>Submit</button>
    </main>
  );
}
