import config from "@config/config.json";
import { markdownify } from "@lib/utils/textConverter";
import { useState } from "react";

const Contato = ({ data }) => {
  const { frontmatter } = data;
  const { title, info, email } = frontmatter;
  const { contact_form_action } = config.params;
  const [emailSent, setEmailSent] = useState(false);

  const parseMailResponse = (responseText) => {
    const trimmedResponse = responseText.trim();

    try {
      return JSON.parse(trimmedResponse);
    } catch (_error) {
      const jsonMatch = trimmedResponse.match(/\{[\s\S]*\}$/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      const res = await fetch(contact_form_action, {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      const responseData = parseMailResponse(responseText);

      if (res.ok && responseData?.success) {
        setEmailSent(true);
        form.reset();
      } else {
        alert(responseData?.error || email?.error || "Erro ao enviar a mensagem");
      }
    } catch (_err) {
      alert(email?.error || "Erro ao enviar a mensagem");
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">{title}</h1>
        <div className="section row pb-0">
          <div className="col-12 md:col-6 lg:col-7">
            <form
              className="contact-form"
              method="POST"
              action={contact_form_action}
              onSubmit={handleSubmit}
            >
              <input
                className="form-input w-full mb-3 rounded"
                name="name"
                type="text"
                placeholder="Nome"
                required
              />
              <input
                className="form-input w-full mb-3 rounded"
                name="email"
                type="email"
                placeholder="Email"
                required
              />
              <input
                className="form-input w-full mb-3 rounded"
                name="subject"
                type="text"
                placeholder="Assunto"
                required
              />
              <textarea
                name="message"
                className="form-textarea w-full mb-3 rounded-md"
                rows="7"
                placeholder="Sua mensagem"
              />
          
              {emailSent ? (
                <p className="text-white bg-lime-500 p-3 rounded">
                  {email?.success || "Mensagem enviada"}
                </p>
              ) : (
                <button type="submit" className="btn btn-primary">Enviar mensagem</button>
              )}
            </form>
          </div>
          <div className="content col-12 md:col-6 lg:col-5">
            {markdownify(info.title, "h4")}
            {markdownify(info.description, "p", "mt-4")}
            <ul className="contact-list mt-5">
              {info?.contacts?.map((contact, index) => (
                <li key={index}>
                  {markdownify(contact, "strong", "text-dark")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contato;
