import { ExternalLink, FileText } from "lucide-react";

const formatFileSize = (size) => {
  if (!size || Number.isNaN(Number(size))) {
    return null;
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = Number(size);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getFileLabel = (file) => {
  const extension = file?.extensao ? file.extensao.toUpperCase() : null;
  const size = formatFileSize(file?.tamanho);

  return [extension, size].filter(Boolean).join(" • ");
};

export default function PostFiles({ files }) {
  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 rounded-xl p-6 md:p-8 bg-white">
      <h2 className="text-2xl font-semibold text-foreground mb-5">
        Arquivos para download
      </h2>

      <div className="space-y-3">
        {files.map((file) => {
          const fileLabel = getFileLabel(file);

          return (
            <div
              key={file.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F57622]/10 text-primary">
                  <FileText size={20} aria-hidden="true" />
                </span>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {file?.titulo || file?.nome_original || "Arquivo"}
                  </h3>

                  {(file?.nome_original || fileLabel) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[file?.nome_original, fileLabel].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              {file?.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Abrir ou baixar
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
