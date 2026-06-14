import { useNavigate } from "react-router-dom";

function PdfLibrary({ pdfs = [] }) {
  const navigate = useNavigate();

  const handleOpenPdf = (id) => {
    localStorage.setItem("activePdfId", id);
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="w-full max-w-5xl mt-8">
      <h2 className="text-xl text-white font-semibold mb-4">
        Uploaded PDFs
      </h2>

      {pdfs.length === 0 ? (
        <p className="text-slate-500 text-sm italic">No PDFs uploaded yet. Upload one above to get started!</p>
      ) : (
        <div className="space-y-3">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              onClick={() => handleOpenPdf(pdf.id)}
              className="
              bg-[#111827]
              border
              border-slate-700
              rounded-2xl
              p-4
              hover:border-purple-500
              transition-all
              cursor-pointer
              "
            >
              <h3 className="text-white font-medium">
                📄 {pdf.filename}
              </h3>

              <p className="text-slate-400 text-sm mt-1">
                {pdf.characters_count} characters
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PdfLibrary;