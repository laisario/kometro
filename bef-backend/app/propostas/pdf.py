from django.template.loader import get_template

from weasyprint import HTML


def render_to_pdf(template_src, context_dict):
    html = get_template(template_src).render(context_dict)
    pdf = HTML(file_obj=html).write_pdf()
    return pdf
