import { ExternalLink, FileText, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_FORM = {
  nome: "",
  empresa: "",
  email: "",
  telefone: "",
};

const validateForm = (form) => {
  const errors = {};

  if (!form.nome.trim()) errors.nome = "Informe seu nome.";
  if (!form.empresa.trim()) errors.empresa = "Informe sua empresa.";
  if (!form.email.trim()) {
    errors.email = "Informe seu email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Informe um email válido.";
  }
  if (!form.telefone.trim()) errors.telefone = "Informe seu telefone.";

  return errors;
};

const getApiErrors = (data) => {
  const fields = ["nome", "empresa", "email", "telefone"];

  return fields.reduce((errors, field) => {
    const message = data?.[field];
    if (message) {
      errors[field] = Array.isArray(message) ? message[0] : message;
    }
    return errors;
  }, {});
};

const openFile = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default function PostFileAccessDialog({ file, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!file) return undefined;

    setForm(EMPTY_FORM);
    setFieldErrors({});
    setApiError("");
    setIsSubmitting(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [file, onClose]);

  if (!file) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blog/arquivos/${file.id}/acesso/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            empresa: form.empresa.trim(),
            email: form.email.trim(),
            telefone: form.telefone.trim(),
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiFieldErrors = getApiErrors(data);
        setFieldErrors(apiFieldErrors);
        setApiError(
          Object.keys(apiFieldErrors).length
            ? "Revise os campos indicados."
            : data?.detail || "Não foi possível liberar o arquivo. Tente novamente."
        );
        return;
      }

      if (!data?.download_url) {
        setApiError("O arquivo não pôde ser liberado. Tente novamente.");
        return;
      }

      openFile(data.download_url);
      onClose();
    } catch (_error) {
      setApiError(
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestedFileName =
    file?.titulo || file?.nome_original || "Arquivo selecionado";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px]"
        aria-label="Fechar formulário"
        onClick={() => !isSubmitting && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-file-access-title"
        className="relative z-10 grid max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(33,33,33,0.24)] lg:grid-cols-[58%_42%]"
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-30 rounded-full bg-white p-2 text-gray-500 shadow-md ring-1 ring-black/5 transition hover:text-primary disabled:opacity-50 sm:right-5 sm:top-5"
          aria-label="Fechar"
          onClick={onClose}
          disabled={isSubmitting}
        >
          <X size={22} aria-hidden="true" />
        </button>

        <div className="max-h-[94vh] overflow-y-auto p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="pr-10 lg:pr-0">
            <h2
              id="post-file-access-title"
              className="text-2xl font-bold leading-tight text-dark sm:text-3xl"
            >
              Preencha seus dados para acessar o arquivo
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
              Informe seus dados abaixo para continuar.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-orange-100 bg-theme-lighter px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
              <FileText size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                Arquivo solicitado
              </p>
              <p className="mt-0.5 break-words text-sm font-semibold leading-snug text-dark">
                {requestedFileName}
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {[
              {
                name: "nome",
                label: "Nome",
                type: "text",
                autoComplete: "name",
              },
              {
                name: "empresa",
                label: "Empresa",
                type: "text",
                autoComplete: "organization",
              },
              {
                name: "email",
                label: "Email",
                type: "email",
                autoComplete: "email",
              },
              {
                name: "telefone",
                label: "Telefone",
                type: "tel",
                autoComplete: "tel",
              },
            ].map((field) => {
              const errorId = `${field.name}-error`;
              const error = fieldErrors[field.name];

              return (
                <div key={field.name}>
                  <label
                    htmlFor={`post-file-${field.name}`}
                    className="mb-1.5 block text-sm font-semibold text-dark"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`post-file-${field.name}`}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    value={form[field.name]}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className={`form-input h-12 w-full rounded-lg border bg-white px-4 text-base shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                      error
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-border"
                    }`}
                  />
                  {error && (
                    <p id={errorId} className="mt-1.5 text-xs text-red-600">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}

            {apiError && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Liberando arquivo...
                </>
              ) : (
                <>
                  Continuar para o arquivo
                  <ExternalLink size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="hidden min-h-0 items-center justify-center overflow-hidden bg-theme-lighter px-8 pb-8 pt-16 lg:flex xl:px-10 xl:pb-10">
          <img
            src="https://kometro.nyc3.cdn.digitaloceanspaces.com/landing-page/images/ilustracao_download_kometro.png"
            alt="Ilustração de um arquivo disponível para download"
            className="h-full max-h-[720px] w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
