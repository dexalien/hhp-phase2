from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

OUTPUT = "D:/dev/openhouse-hhp/HHP_Buildathon_Plan.pdf"

# --- Paleta ---
DARK_BG     = colors.HexColor("#0D0D0D")
ACCENT_PINK = colors.HexColor("#990070")
ACCENT_PURP = colors.HexColor("#8B78E6")
ACCENT_GRN  = colors.HexColor("#6EE76E")
ACCENT_ARBI = colors.HexColor("#1B4ADD")
WHITE       = colors.HexColor("#FFFFFF")
LIGHT_GRAY  = colors.HexColor("#CCCCCC")
MID_GRAY    = colors.HexColor("#888888")
DARK_CARD   = colors.HexColor("#1A1A1A")
CARD_ALT    = colors.HexColor("#161616")
BORDER_GRAY = colors.HexColor("#2A2A2A")
HEADER_BG   = colors.HexColor("#1E1E1E")
ORANGE      = colors.HexColor("#FFA500")

W, H = A4

# --- Estilos ---
def s(name, **kw):
    return ParagraphStyle(name, **kw)

ST = {
    "cover_eyebrow": s("cover_eyebrow", fontName="Helvetica-Bold", fontSize=9,
        textColor=ACCENT_GRN, leading=13, alignment=TA_LEFT),
    "cover_title": s("cover_title", fontName="Helvetica-Bold", fontSize=26,
        textColor=WHITE, leading=32, alignment=TA_LEFT, spaceAfter=6),
    "cover_sub": s("cover_sub", fontName="Helvetica", fontSize=12,
        textColor=LIGHT_GRAY, leading=18, alignment=TA_LEFT),
    "section": s("section", fontName="Helvetica-Bold", fontSize=14,
        textColor=WHITE, leading=20, spaceBefore=4, spaceAfter=6),
    "subsection": s("subsection", fontName="Helvetica-Bold", fontSize=10.5,
        textColor=ACCENT_PURP, leading=15, spaceBefore=10, spaceAfter=4),
    "body": s("body", fontName="Helvetica", fontSize=9.5,
        textColor=LIGHT_GRAY, leading=15, spaceAfter=4),
    "body_white": s("body_white", fontName="Helvetica", fontSize=9.5,
        textColor=WHITE, leading=15, spaceAfter=4),
    "bullet": s("bullet", fontName="Helvetica", fontSize=9.5,
        textColor=LIGHT_GRAY, leading=15, leftIndent=12, spaceAfter=3),
    "caption": s("caption", fontName="Helvetica", fontSize=8,
        textColor=MID_GRAY, leading=12),
    "th": s("th", fontName="Helvetica-Bold", fontSize=9,
        textColor=WHITE, leading=13, alignment=TA_CENTER),
    "td": s("td", fontName="Helvetica", fontSize=8.5,
        textColor=LIGHT_GRAY, leading=13),
    "td_bold": s("td_bold", fontName="Helvetica-Bold", fontSize=8.5,
        textColor=WHITE, leading=13),
    "center_gray": s("center_gray", fontName="Helvetica", fontSize=8.5,
        textColor=MID_GRAY, leading=13, alignment=TA_CENTER),
    "quote": s("quote", fontName="Helvetica-BoldOblique", fontSize=11.5,
        textColor=WHITE, leading=18, alignment=TA_CENTER),
    "week_num": s("week_num", fontName="Helvetica-Bold", fontSize=8,
        textColor=WHITE, leading=12),
    "week_title": s("week_title", fontName="Helvetica-Bold", fontSize=11,
        textColor=WHITE, leading=15),
}

def sp(h=0.3):
    return Spacer(1, h * cm)

def hr(color=BORDER_GRAY, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=8, spaceBefore=4)

def section_header(text, accent=ACCENT_PINK):
    return [
        HRFlowable(width="100%", thickness=2, color=accent,
                   spaceAfter=6, spaceBefore=18),
        Paragraph(text, ST["section"]),
    ]

BASE_TABLE_STYLE = [
    ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [DARK_CARD, CARD_ALT]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]

def ctable(rows, widths, extras=None):
    style = list(BASE_TABLE_STYLE)
    if extras:
        style.extend(extras)
    t = Table(rows, colWidths=widths)
    t.setStyle(TableStyle(style))
    return t

def week_card(num, title, accent, roles):
    rows = [[
        Paragraph(f"SEMANA {num}", s(f"wn{num}", fontName="Helvetica-Bold",
            fontSize=8, textColor=accent, leading=12)),
        Paragraph(title, ST["week_title"]),
    ]]
    for role, tasks in roles.items():
        rows.append([
            Paragraph(role, s(f"wr{role}", fontName="Helvetica-Bold",
                fontSize=8, textColor=accent, leading=13)),
            Paragraph("\n".join(f"• {t}" for t in tasks),
                s(f"wt{role}", fontName="Helvetica", fontSize=8.5,
                  textColor=LIGHT_GRAY, leading=14)),
        ])
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111111")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [DARK_CARD, CARD_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
        ("LINEABOVE", (0, 0), (-1, 0), 2, accent),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    t = Table(rows, colWidths=[3.2*cm, 13.8*cm])
    t.setStyle(TableStyle(style))
    return t

def dark_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="HHP — Buildathon Strategy v2",
        author="Hacker House Protocol")

    story = []

    # ── PORTADA ───────────────────────────────────────────────────────────────
    story.append(sp(2))
    story.append(Paragraph("HACKER HOUSE PROTOCOL", ST["cover_eyebrow"]))
    story.append(sp(0.3))
    story.append(Paragraph("Estrategia para el\nArbitrum Buildathon", ST["cover_title"]))
    story.append(sp(0.2))
    story.append(Paragraph(
        "Arbitrum Open House London Online Buildathon · Plan de 3 semanas · Mayo 2026",
        ST["cover_sub"]))
    story.append(sp(0.5))

    meta = Table([[
        Paragraph("Equipo", ST["caption"]),
        Paragraph("Plazo", ST["caption"]),
        Paragraph("Protagonista", ST["caption"]),
        Paragraph("Diferenciador", ST["caption"]),
    ],[
        Paragraph("Front · Back · Producto · Web3", ST["body_white"]),
        Paragraph("3 semanas", ST["body_white"]),
        Paragraph("HackerHouses", s("g", fontName="Helvetica-Bold", fontSize=9,
            textColor=ACCENT_GRN, leading=13)),
        Paragraph("Smart Contract Arbitrum", s("a", fontName="Helvetica-Bold", fontSize=9,
            textColor=ACCENT_ARBI, leading=13)),
    ]], colWidths=[4.5*cm, 3*cm, 4*cm, 6*cm])
    meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK_CARD),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
        ("LINEABOVE", (0, 0), (-1, 0), 2, ACCENT_ARBI),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(meta)
    story.append(sp(2))
    story.append(hr(ACCENT_PINK, 1))

    # ── 1. ONE-LINER + PROBLEMA ───────────────────────────────────────────────
    story.extend(section_header("1. EL PITCH", ACCENT_PINK))

    quote_box = Table([[Paragraph(
        '"El lugar donde los builders encuentran su casa — y la coordinan on-chain."',
        ST["quote"])]], colWidths=[17.5*cm])
    quote_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0A0A20")),
        ("LINEABOVE",  (0, 0), (-1, 0), 3, ACCENT_ARBI),
        ("LINEBELOW",  (0, 0), (-1, -1), 3, ACCENT_ARBI),
        ("TOPPADDING",    (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("LEFTPADDING",   (0, 0), (-1, -1), 20),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 20),
    ]))
    story.append(quote_box)
    story.append(sp(0.4))

    story.append(Paragraph("El problema", ST["subsection"]))
    story.append(Paragraph(
        "Los builders Web3 viajan a los mismos eventos, en las mismas ciudades, en las mismas fechas. "
        "Pero coordinar quien va, donde se quedan y como se organiza el espacio sigue siendo un caos "
        "de mensajes, hojas de calculo y transferencias manuales donde alguien siempre tiene que "
        "confiar en alguien. No hay infraestructura. Solo grupos de WhatsApp.",
        ST["body"]))
    story.append(sp(0.3))

    story.append(Paragraph("La solucion", ST["subsection"]))
    story.append(Paragraph(
        "Un builder entra a HHP, explora Hacker Houses disponibles filtradas por ubicacion, fechas o "
        "perfil buscado, y aplica. Si es aceptado, su cupo queda coordinado on-chain en Arbitrum: "
        "los fondos se lockean en el contrato y se liberan al organizador solo si la house se llena. "
        "Si no se llena antes del deadline, el reembolso es automatico — sin intermediarios, sin "
        "confianza ciega. La coordinacion que antes dependia de una persona de confianza, "
        "ahora la ejecuta el contrato.",
        ST["body"]))
    story.append(sp(0.5))

    # ── 2. FLUJO CORE ─────────────────────────────────────────────────────────
    story.extend(section_header("2. FLUJO CORE — El usuario individual", ACCENT_PURP))

    flow_rows = [
        ["1", "Builder entra a la app"],
        ["2", "Explora Hacker Houses — filtra por ciudad, fecha o perfil buscado"],
        ["3", "Encuentra una que le interesa → aplica"],
        ["4", "Es aceptado → hace deposit en Arbitrum (fondos lockeados en el contrato)"],
        ["5a", "House llena antes del deadline  →  fondos liberados al organizador"],
        ["5b", "House no llena antes del deadline  →  refund automatico a cada depositor"],
    ]
    accents_flow = [ACCENT_PURP]*4 + [ACCENT_GRN, ACCENT_PINK]
    flow_table_rows = [[
        Paragraph(n, s(f"fn{i}", fontName="Helvetica-Bold", fontSize=10,
            textColor=accents_flow[i], leading=14, alignment=TA_CENTER)),
        Paragraph(desc, ST["body"])
    ] for i, (n, desc) in enumerate(flow_rows)]

    ft = Table(flow_table_rows, colWidths=[1.5*cm, 16*cm])
    ft.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [DARK_CARD, CARD_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",  (0, 0), (0, -1), "CENTER"),
        ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#0D1A0D")),
        ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#1A0D0D")),
    ]))
    story.append(ft)
    story.append(sp(0.4))

    story.append(Paragraph(
        "Transparente. Sin friccion. Sin riesgo de perder fondos por una cancelacion unilateral.",
        s("tagline", fontName="Helvetica-Bold", fontSize=9.5, textColor=ACCENT_GRN,
          leading=14, alignment=TA_CENTER)))
    story.append(sp(0.5))

    # ── 3. DECISION DE SCOPE ──────────────────────────────────────────────────
    story.extend(section_header("3. DECISION DE SCOPE — Que entra, que se congela", ACCENT_PINK))

    story.append(Paragraph(
        "HackSpaces no se borra — ya esta construido y borrarlo significa perder semanas de trabajo. "
        "La decision es <b>congelar su desarrollo</b> estas 3 semanas y no protagonizar el pitch.",
        ST["body"]))
    story.append(sp(0.3))

    scope_rows = [
        [Paragraph("Feature", ST["th"]),
         Paragraph("Decision", ST["th"]),
         Paragraph("Razon", ST["th"])],
        [Paragraph("HackerHouses", ST["td_bold"]),
         Paragraph("PROTAGONISTA", s("p1", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_GRN, leading=13)),
         Paragraph("Core del pitch. Ya implementado — se le agrega el contrato Arbitrum.", ST["td"])],
        [Paragraph("Smart Contract Arbitrum", ST["td_bold"]),
         Paragraph("BUILD NOW", s("p2", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_ARBI, leading=13)),
         Paragraph("El diferenciador real. Sin esto es una app SaaS con wallet login decorativo.", ST["td"])],
        [Paragraph("Comunidades", ST["td_bold"]),
         Paragraph("BUILD NOW (scope acotado)", s("p3", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_PURP, leading=13)),
         Paragraph("Growth layer adicional. Invite link + badge + filtro. Sin gobernanza ni paginas publicas.", ST["td"])],
        [Paragraph("HackSpaces (nuevas features)", ST["td_bold"]),
         Paragraph("CONGELADO", s("p4", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=MID_GRAY, leading=13)),
         Paragraph("Existe, funciona, no se toca. Se menciona como parte del ecosistema.", ST["td"])],
    ]
    story.append(ctable(scope_rows, [4.5*cm, 3.5*cm, 9.5*cm]))
    story.append(sp(0.5))

    # ── 4. SMART CONTRACT ─────────────────────────────────────────────────────
    story.extend(section_header("4. SMART CONTRACT ARBITRUM — El diferenciador", ACCENT_ARBI))

    story.append(Paragraph(
        "Sin el contrato, HHP es una app con un boton de connect wallet. "
        "Con el contrato, es un protocolo. Arbitrum ejecuta la logica de negocio critica — "
        "ningun intermediario humano toca los fondos.",
        ST["body"]))
    story.append(sp(0.3))
    story.append(Paragraph("Logica del contrato — HackerHouseEscrow.sol", ST["subsection"]))

    contract_rows = [
        [Paragraph("Accion", ST["th"]),
         Paragraph("Quien", ST["th"]),
         Paragraph("Que ocurre on-chain", ST["th"])],
        [Paragraph("createHouse()", ST["td_bold"]),
         Paragraph("Organizador", ST["td"]),
         Paragraph("Deploy con capacidad, precio por persona y deadline de llenado.", ST["td"])],
        [Paragraph("deposit()", ST["td_bold"]),
         Paragraph("Builder aceptado", ST["td"]),
         Paragraph("Fondos lockeados en el contrato. Builder tiene su cupo reservado.", ST["td"])],
        [Paragraph("release() — auto", ST["td_bold"]),
         Paragraph("Contrato", ST["td"]),
         Paragraph("House llena antes del deadline: fondos liberados al organizador.", ST["td"])],
        [Paragraph("refund() — auto", ST["td_bold"]),
         Paragraph("Contrato", ST["td"]),
         Paragraph("Deadline sin llenar: refund automatico a cada depositor. Sin intervencion humana.", ST["td"])],
        [Paragraph("reject()", ST["td_bold"]),
         Paragraph("Organizador", ST["td"]),
         Paragraph("Rechaza un applicant: devuelve su deposit inmediatamente.", ST["td"])],
    ]
    story.append(ctable(contract_rows, [3.5*cm, 3*cm, 11*cm], [
        ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#0D1A0D")),
        ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#1A0D0D")),
    ]))
    story.append(sp(0.3))

    story.append(Paragraph("Por que Arbitrum", ST["subsection"]))
    for item in [
        "Gas fees bajos — critico para deposits de co-living (montos accesibles, no enormes)",
        "EVM-compatible — Solidity directo, sin cambios de arquitectura en el stack",
        "Privy ya soporta Arbitrum — sin cambios en la capa de auth",
        "El buildathon es de Arbitrum — fit de ecosistema con los jueces",
    ]:
        story.append(Paragraph(f"• {item}", ST["bullet"]))
    story.append(sp(0.5))

    # ── 5. COMUNIDADES ────────────────────────────────────────────────────────
    story.extend(section_header("5. COMUNIDADES — Growth layer adicional", ACCENT_PURP))

    story.append(Paragraph(
        "El flujo principal es individual: cualquier builder entra solo y aplica a una Hacker House. "
        "Las comunidades son un canal adicional de adquisicion: un grupo organizado llega con sus "
        "miembros via invite link. No es el caso comun — es el caso excepcional que acelera el "
        "crecimiento inicial.",
        ST["body"]))
    story.append(sp(0.3))
    story.append(Paragraph("Arquitectura — Organizations extendida", ST["subsection"]))
    story.append(Paragraph(
        "La tabla <b>organizations</b> ya esta planificada en Supabase (Fase 2, para Hacker Houses "
        "patrocinadas). Se extiende con <b>type: 'organization' | 'community'</b> para servir "
        "ambos casos sin duplicar infraestructura.",
        ST["body"]))
    story.append(sp(0.3))

    schema_rows = [
        [Paragraph("Tabla", ST["th"]),
         Paragraph("Campos clave", ST["th"]),
         Paragraph("Proposito", ST["th"])],
        [Paragraph("organizations", ST["td_bold"]),
         Paragraph("id, slug, name, type, logo_url, creator_id, invite_code, is_verified", ST["td"]),
         Paragraph("Comunidad informal u organizacion verificada (mismo modelo, distinto type).", ST["td"])],
        [Paragraph("org_members", ST["td_bold"]),
         Paragraph("org_id, user_id, role ('admin'|'member'), joined_at", ST["td"]),
         Paragraph("Un builder puede pertenecer a multiples comunidades.", ST["td"])],
    ]
    story.append(ctable(schema_rows, [3.5*cm, 7*cm, 7*cm]))
    story.append(sp(0.3))

    story.append(Paragraph("Scope MVP de comunidades (solo esto, nada mas)", ST["subsection"]))
    for item in [
        "Invite link: hackerhouse.app/join/[slug] — auto-asigna al builder a la comunidad al registrarse",
        "Badge de comunidad visible en perfil publico y en BuilderCard del feed",
        "Filtro por comunidad en Builder Discovery",
        "Sin pagina publica de comunidad, sin gobernanza, sin comunidades privadas (V2)",
    ]:
        story.append(Paragraph(f"• {item}", ST["bullet"]))
    story.append(sp(0.5))

    # ── 6. PLAN 3 SEMANAS ─────────────────────────────────────────────────────
    story.extend(section_header("6. PLAN DE 3 SEMANAS — Por rol", ACCENT_GRN))

    story.append(KeepTogether([
        week_card(1, "Comunidades + Research del contrato", ACCENT_PURP, {
            "PRODUCTO": [
                "Definir flujo completo de invite link y onboarding de comunidad",
                "Spec del badge y filtros en Builder Discovery",
                "Coordinar con Web3 los parametros que el contrato necesita exponer al backend",
            ],
            "BACK": [
                "Migracion Supabase: tabla organizations + org_members + RLS policies",
                "API: POST /api/communities, GET /api/communities/[slug]",
                "Logica de invite_code: validacion + asignacion automatica en registro",
            ],
            "FRONT": [
                "Badge de comunidad en ProfileCard y perfil publico",
                "Pagina /join/[slug] — landing de invitacion con CTA de registro",
                "Filtro por comunidad en Builder Discovery",
            ],
            "WEB3": [
                "Definir interface del contrato (funciones, eventos, parametros)",
                "Setup Hardhat + Arbitrum Sepolia testnet",
                "Primer borrador de HackerHouseEscrow.sol",
            ],
        }),
        sp(0.4),
    ]))

    story.append(KeepTogether([
        week_card(2, "Smart Contract + Integracion backend", ACCENT_ARBI, {
            "WEB3": [
                "Implementar createHouse(), deposit(), release(), refund(), reject()",
                "Tests unitarios: house llena, deadline sin llenar, rechazo de applicant",
                "Deploy en Arbitrum Sepolia — exponer ABI y contract address",
            ],
            "BACK": [
                "Guardar contract_address en tabla hacker_houses",
                "Listener para sincronizar estado del contrato con DB",
                "Endpoint GET /api/hacker-houses/[id]/contract-status",
            ],
            "FRONT": [
                "Componente de deposit en detalle de HackerHouse (wagmi/viem)",
                "Estado en tiempo real: depositos actuales vs capacidad",
                "Notificacion in-app al llenarse la house o ejecutarse el refund",
            ],
            "PRODUCTO": [
                "Testing del flujo completo en testnet",
                "Documentar el flujo para el pitch",
                "Priorizar edge cases con Web3 dev",
            ],
        }),
        sp(0.4),
    ]))

    story.append(KeepTogether([
        week_card(3, "Polish, Demo Flow y Deploy", ACCENT_GRN, {
            "PRODUCTO": [
                "Definir y ensayar el demo flow de 5 minutos",
                "Preparar presentacion: problema, solucion, demo en vivo, roadmap, ask",
                "2 rondas de dogfooding interno sin bugs bloqueantes",
            ],
            "FRONT": [
                "Polish del flujo completo: HackerHouse + contrato + comunidades",
                "Mobile responsive en todas las pantallas nuevas",
                "Loading states, error handling y toasts para interacciones on-chain",
            ],
            "BACK": [
                "Stress test de endpoints criticos",
                "Verificar que RLS no bloquea ningun paso del demo flow",
                "Logs y monitoreo para el dia del buildathon",
            ],
            "WEB3": [
                "Deploy en Arbitrum One (mainnet) segun requisitos del buildathon",
                "Verificar contrato en Arbiscan",
                "Soporte tecnico on-chain disponible durante el demo",
            ],
        }),
        sp(0.4),
    ]))

    # ── 7. DIFERENCIADORES ────────────────────────────────────────────────────
    story.extend(section_header("7. DIFERENCIADORES", ACCENT_PINK))

    diff_rows = [
        [Paragraph("Diferenciador", ST["th"]), Paragraph("Detalle", ST["th"])],
        [Paragraph("Coordinacion on-chain real", ST["td_bold"]),
         Paragraph("Arbitrum ejecuta la logica de negocio critica. Los fondos no pasan por "
             "ningun intermediario — el contrato es el coordinador.", ST["td"])],
        [Paragraph("Identidad on-chain nativa", ST["td_bold"]),
         Paragraph("POAPs, Talent Protocol skill tags, wallet con historial. El matching usa "
             "datos verificables, no auto-declarados.", ST["td"])],
        [Paragraph("Flujo individual sin friccion", ST["td_bold"]),
         Paragraph("Cualquier builder entra solo, sin pertenecer a ninguna comunidad, "
             "y aplica a una Hacker House en minutos.", ST["td"])],
        [Paragraph("Comunidades como growth layer", ST["td_bold"]),
         Paragraph("Canal adicional de adquisicion: un grupo organizado trae a sus miembros "
             "en bloque via invite link. Excepcional, no requerido.", ST["td"])],
    ]
    story.append(ctable(diff_rows, [5*cm, 12.5*cm]))
    story.append(sp(0.5))

    # ── 8. RIESGOS ────────────────────────────────────────────────────────────
    story.extend(section_header("8. RIESGOS Y MITIGACION", ACCENT_PINK))

    risk_rows = [
        [Paragraph("Riesgo", ST["th"]),
         Paragraph("Prob.", ST["th"]),
         Paragraph("Mitigacion", ST["th"])],
        [Paragraph("Contrato tarda mas de lo esperado", ST["td_bold"]),
         Paragraph("MEDIA", s("rm", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ORANGE, leading=13)),
         Paragraph("Web3 dev arranca en semana 1. Si hay bloqueo en semana 2, "
             "el pitch presenta el contrato en testnet como demo funcional.", ST["td"])],
        [Paragraph("Scope creep en comunidades", ST["td_bold"]),
         Paragraph("ALTA", s("ra", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_PINK, leading=13)),
         Paragraph("El MVP de comunidades es: invite link + badge + filtro. "
             "Sin gobernanza, sin paginas publicas, sin privacidad. Todo lo demas es V2.", ST["td"])],
        [Paragraph("Buildathon requiere mainnet (no testnet)", ST["td_bold"]),
         Paragraph("BAJA", s("rb", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_GRN, leading=13)),
         Paragraph("Verificar requisitos en semana 1. Deploy a mainnet toma menos "
             "de 1 hora si el contrato ya paso tests internos.", ST["td"])],
        [Paragraph("Mobile no responsive a tiempo", ST["td_bold"]),
         Paragraph("MEDIA", s("rm2", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ORANGE, leading=13)),
         Paragraph("Front prioriza mobile desde el inicio. Si hay tiempo limite, "
             "el demo se hace en desktop.", ST["td"])],
    ]
    story.append(ctable(risk_rows, [5*cm, 2*cm, 10.5*cm]))
    story.append(sp(0.5))

    # ── 9. ESTADO + METRICAS ──────────────────────────────────────────────────
    story.extend(section_header("9. ESTADO ACTUAL Y METRICAS OBJETIVO", ACCENT_GRN))

    story.append(Paragraph("Estado de implementacion", ST["subsection"]))
    estado_rows = [
        [Paragraph("Feature", ST["th"]), Paragraph("Estado", ST["th"])],
        [Paragraph("Auth + Cypher Identity (perfil on-chain)", ST["td"]),
         Paragraph("IMPLEMENTADO", s("ei", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_GRN, leading=13))],
        [Paragraph("Hacker Houses (crear, listar, aplicar, gestionar)", ST["td"]),
         Paragraph("IMPLEMENTADO", s("ei2", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_GRN, leading=13))],
        [Paragraph("Builder Discovery + Matching algoritmico", ST["td"]),
         Paragraph("IMPLEMENTADO", s("ei3", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_GRN, leading=13))],
        [Paragraph("Sistema de amistades + Notificaciones + Mapa", ST["td"]),
         Paragraph("IMPLEMENTADO", s("ei4", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_GRN, leading=13))],
        [Paragraph("Smart contract Arbitrum (escrow de coordinacion)", ST["td"]),
         Paragraph("EN DESARROLLO — Semanas 1-2", s("ed", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_ARBI, leading=13))],
        [Paragraph("Integracion contrato con UI de HackerHouses", ST["td"]),
         Paragraph("EN DESARROLLO — Semanas 2-3", s("ed2", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_ARBI, leading=13))],
        [Paragraph("Comunidades (invite link, badge, filtros)", ST["td"]),
         Paragraph("EN DESARROLLO — Semana 1", s("ed3", fontName="Helvetica-Bold", fontSize=8.5,
             textColor=ACCENT_PURP, leading=13))],
    ]
    story.append(ctable(estado_rows, [10*cm, 7.5*cm]))
    story.append(sp(0.4))

    story.append(Paragraph("Metricas objetivo — 60 dias post-buildathon", ST["subsection"]))
    metrics_rows = [
        [Paragraph("Metrica", ST["th"]), Paragraph("Target", ST["th"])],
        [Paragraph("Builders registrados", ST["td"]),
         Paragraph("200", ST["td_bold"])],
        [Paragraph("Hacker Houses creadas", ST["td"]),
         Paragraph("15", ST["td_bold"])],
        [Paragraph("Houses con deposito on-chain activo", ST["td"]),
         Paragraph("8", ST["td_bold"])],
        [Paragraph("ETH coordinado via contrato", ST["td"]),
         Paragraph("5 ETH", ST["td_bold"])],
        [Paragraph("Eventos cubiertos", ST["td"]),
         Paragraph("3 (ETHGlobal + 2 regionales)", ST["td_bold"])],
        [Paragraph("Comunidades onboarded", ST["td"]),
         Paragraph("3", ST["td_bold"])],
    ]
    story.append(ctable(metrics_rows, [12*cm, 5.5*cm]))
    story.append(sp(0.5))

    # ── FOOTER ────────────────────────────────────────────────────────────────
    story.append(hr(BORDER_GRAY))
    story.append(Paragraph(
        "Hacker House Protocol · Documento interno v2.1 · Mayo 2026",
        ST["center_gray"]))

    doc.build(story, onFirstPage=dark_page, onLaterPages=dark_page)
    print(f"PDF generado: {OUTPUT}")

build_pdf()
