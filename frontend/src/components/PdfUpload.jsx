import { useState } from "react";
import { uploadPdf } from "../services/pdfService";
import toast from "react-hot-toast";

function PdfUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const toastId = toast.loading(`Uploading "${file.name}"...`);
    try {
      setUploading(true);

      const data = await uploadPdf(file);

      console.log(data);

      toast.success("PDF Uploaded Successfully", { id: toastId });
      
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload Failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="
      mt-8
      w-full
      max-w-5xl
      border-2
      border-dashed
      border-slate-700
      rounded-3xl
      p-12
      text-center
      hover:border-purple-500
      transition-all
      duration-300
      "
    >
      <h2 className="text-2xl text-white font-semibold mb-3">
        Upload Your PDF
      </h2>

      <p className="text-slate-400">
        Drag & Drop PDF here or click below
      </p>

      <label
        className="
        inline-block
        mt-6
        px-6
        py-3
        bg-gradient-to-r
        from-purple-600
        to-fuchsia-500
        rounded-xl
        text-white
        cursor-pointer
        hover:scale-105
        transition-all
        "
      >
        {uploading
          ? "Uploading..."
          : "Choose PDF"}

        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}

export default PdfUpload;