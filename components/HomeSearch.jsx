"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Camera, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { processImageSearch } from "@/actions/home";

const HomeSearch = () => {
  const [searchTerm, setSearchTerm] = useState();
  const [isImageSearchActive, setIsImageSearchActive] = useState(true);
  const [imagePreview, setImagePreview] = useState("");
  const [searchImage, setSearchImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const { loading: isProcessing, fn: processImageFn, data: processResult, error: processError } = useFetch(processImageSearch)


  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm?.trim()) {
      toast.error("Please enter something");
      return;
    }
    router.push(`/cars?search=${encodeURIComponent(searchTerm)}`)
  };
  const handleImageSearch = async (e) => {
    e.preventDefault();
    if (!searchImage) {
      toast.error("Please upload an image first")
      return;
    }
    await processImageFn(searchImage);
  };

  useEffect(() => {
    if (processError) {
      toast.error(
        "Faild to analyze image" + (processError.message || "Unknown error")
      )
    }
  }, [processError])

  useEffect(() => {
    if (processResult?.success) {
      // Show search result summary
      let summary = [];
      if (processResult.data.make) summary.push(processResult.data.make);
      if (processResult.data.model) summary.push(processResult.data.model);
      if (processResult.data.bodyType) summary.push(processResult.data.bodyType);
      
      if (summary.length > 0) {
        toast.success(`Found: ${summary.join(' ')}`);
      }

      const params = new URLSearchParams();
      if (processResult.data.make) params.set('make', processResult.data.make)
      if (processResult.data.model) params.set('search', processResult.data.model)
      if (processResult.data.bodyType) params.set('bodyType', processResult.data.bodyType)
      if (processResult.data.color) params.set('color', processResult.data.color);
      router.push(`/cars?${params.toString()}`)
    }
  }, [processResult])

  //THIS IS CALLED WHEN IMAGED IS DRAGGED AND DROPPED
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5mb");
        return;
      }
      setIsUploading(true);
      setSearchImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setIsUploading(false);
        toast.success("Image uploaded successfully");
      }
      reader.onerror = () => {
        setIsUploading(false);
        toast.error("Failed to read image");
      }
      reader.readAsDataURL(file);
    }
  };
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png"],
      },
      maxFiles: 1,
    });


  return (
    <div>
      <form onSubmit={handleTextSubmit}>
        <div className="relative flex items-center">
          <Input
            type={"text"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-12 py-6 w-full rounded-full border-gray-300 bg-white/95 backdrop-blur-sm"
            placeholder="Enter make, model or use AI Image Search"
          />

          <div className="absolute right-[100px]">
            <Camera
              className="cursor-pointer rounded-xl p-1.5"
              style={{
                background: isImageSearchActive ? "black" : "",
                color: isImageSearchActive ? "white" : "",
              }}
              size={35}
              onClick={() => setIsImageSearchActive(!isImageSearchActive)}
            />
          </div>

          <Button
            type="submit"
            className="absolute cursor-pointer right-2 rounded-fill"
          >
            Search
          </Button>
        </div>
      </form>

      {isImageSearchActive && (
        <div className="mt-4">
          <form onSubmit={handleImageSearch}>
            <div className="border-2 p-6 text-center border-dashed border-gray-300 rounded-3xl">
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <img src={imagePreview} alt="Car Preview" className="h-40 object-contain mb-4" />
                  <Button variant={"outline"} onClick={() => {
                    setSearchImage(null);
                    setImagePreview("");
                    toast.info("Image Removed")
                  }}>Remove Image</Button>
                </div>
              ) : (
                <div className="cursor-pointer" {...getRootProps()}>
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 mb-2">
                      {isDragActive && !isDragReject
                        ? "Leave the file here to upload"
                        : "Drag and drop a car image or click to select"}
                    </p>

                    {isDragReject && (
                      <p className="text-red-500 mb-2">Invalid Image Type</p>
                    )}
                    <p className="text-gray-400 text-sm">
                      Supports : JPG, PNG (max 5mb)
                    </p>
                  </div>
                </div>
              )}

              {imagePreview && <div>
                <Button type="submit" className="w-full mt-2" disabled={isUploading || isProcessing}>
                  {isUploading ? "Uploading" : isProcessing? "Analyzing Image...": "Search with this image"}
                </Button>
              </div>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HomeSearch;
