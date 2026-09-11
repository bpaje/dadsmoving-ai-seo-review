from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen.canvas import Canvas

out = Path('review-assets/sample-office-move-budget-template.pdf')
out.parent.mkdir(parents=True, exist_ok=True)
c = Canvas(str(out), pagesize=letter)
w, h = letter
c.setFillColorRGB(25/255, 45/255, 78/255)
c.rect(0, h-150, w, 150, stroke=0, fill=1)
c.setFillColorRGB(1, 1, 1)
c.setFont('Helvetica-Bold', 24)
c.drawString(54, h-78, 'Office Move Budget Template')
c.setFont('Helvetica', 12)
c.drawString(54, h-104, 'AI-SEO review placeholder - not a quotation')
c.setFillColorRGB(28/255, 39/255, 51/255)
c.setFont('Helvetica-Bold', 16)
c.drawString(54, h-205, 'Future production task')
text = c.beginText(54, h-232)
text.setFont('Helvetica', 11)
text.setLeading(17)
for line in [
    'This placeholder confirms the proposed downloadable-asset location and CTA.',
    'Before production, Dad\'s operations and finance teams should approve an editable',
    'spreadsheet with formulas, instructions, quote-status fields, and these workstreams:',
    '',
    '- mover scope, crew, vehicles, packing and specialist handling',
    '- building permits, deposits, loading, parking and after-hours charges',
    '- IT, telecoms, furniture, fit-out, storage and reinstatement',
    '- contingency, tax, approvals, actuals and variance',
    '',
    'No prices, rates, or budget assumptions are supplied in this review placeholder.'
]:
    text.textLine(line)
c.drawText(text)
c.setFillColorRGB(23/255, 121/255, 67/255)
c.rect(54, 84, w-108, 6, stroke=0, fill=1)
c.setFillColorRGB(91/255, 102/255, 114/255)
c.setFont('Helvetica', 9)
c.drawString(54, 62, "Dad's Moving & Storage - internal AI-SEO review clone")
c.save()
print(out)
