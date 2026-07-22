import io, json, os, sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

payload=json.load(sys.stdin);buffer=io.BytesIO();font="Helvetica"
for path in ("/System/Library/Fonts/Supplemental/Arial.ttf","/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
    if os.path.exists(path): pdfmetrics.registerFont(TTFont("BabyNest",path));font="BabyNest";break
styles=getSampleStyleSheet();body=ParagraphStyle("Body",parent=styles["BodyText"],fontName=font,fontSize=9.5,leading=14,textColor=colors.HexColor("#1e293b"));title=ParagraphStyle("Title",parent=body,fontSize=22,leading=27,textColor=colors.HexColor("#4f46e5"),alignment=TA_CENTER);heading=ParagraphStyle("Heading",parent=body,fontSize=13,leading=18,textColor=colors.white,spaceBefore=8,spaceAfter=6);small=ParagraphStyle("Small",parent=body,fontSize=8,textColor=colors.HexColor("#64748b"))
def footer(canvas,doc):
    canvas.saveState();canvas.setFont(font,8);canvas.setFillColor(colors.HexColor("#64748b"));canvas.drawString(20*mm,12*mm,"BabyNest Doctor Report");canvas.drawRightString(190*mm,12*mm,str(doc.page));canvas.restoreState()
doc=SimpleDocTemplate(buffer,pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=16*mm,bottomMargin=20*mm,title=f"{payload['baby']['name']} Doctor Report")
story=[Paragraph("BabyNest",title),Spacer(1,3*mm),Paragraph(payload["baby"]["name"],ParagraphStyle("Baby",parent=title,fontSize=17,textColor=colors.HexColor("#0f172a")))]
meta=[[payload["labels"]["birthDate"],payload["baby"]["birthday"]],[payload["labels"]["age"],payload["baby"]["age"]],[payload["labels"]["reportPeriod"],payload["period"]["label"]],[payload["labels"]["generatedAt"],payload["generatedAt"]]]
t=Table(meta,colWidths=[42*mm,120*mm]);t.setStyle(TableStyle([("FONTNAME",(0,0),(-1,-1),font),("FONTSIZE",(0,0),(-1,-1),9),("TEXTCOLOR",(0,0),(0,-1),colors.HexColor("#64748b")),("BOTTOMPADDING",(0,0),(-1,-1),5),("LINEBELOW",(0,0),(-1,-1),.25,colors.HexColor("#e2e8f0"))]));story += [Spacer(1,5*mm),t,Spacer(1,5*mm)]
def section_header(text): return Table([[Paragraph(text,heading)]],colWidths=[174*mm],style=TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#4f46e5")),("LEFTPADDING",(0,0),(-1,-1),8),("ROUNDEDCORNERS",[5])]))
for section in payload["sections"]:
    story.append(section_header(section["title"]));data=[[Paragraph(row["label"],body),Paragraph(row["value"] or "—",body)] for row in section["rows"]] or [[Paragraph("No records",body),""]];table=Table(data,colWidths=[76*mm,98*mm],repeatRows=0);table.setStyle(TableStyle([("FONTNAME",(0,0),(-1,-1),font),("VALIGN",(0,0),(-1,-1),"TOP"),("ROWBACKGROUNDS",(0,0),(-1,-1),[colors.white,colors.HexColor("#f8fafc")]),("GRID",(0,0),(-1,-1),.25,colors.HexColor("#e2e8f0")),("PADDING",(0,0),(-1,-1),6)]));story += [table,Spacer(1,3*mm)]
if payload["summary"]:story += [section_header(payload["labels"]["summary"])]+[Paragraph(f"• {line}",body) for line in payload["summary"]]+[Spacer(1,3*mm)]
if payload["timeline"]:
    story.append(section_header(payload["labels"]["timeline"]))
    for day in payload["timeline"]:story.append(Paragraph(day["day"],ParagraphStyle("Day",parent=body,fontSize=11,textColor=colors.HexColor("#4f46e5"),spaceBefore=6)));story.extend(Paragraph(entry,body) for entry in day["entries"])
story += [Spacer(1,6*mm),Paragraph(payload["labels"]["disclaimer"],small)]
doc.build(story,onFirstPage=footer,onLaterPages=footer);sys.stdout.buffer.write(buffer.getvalue())
