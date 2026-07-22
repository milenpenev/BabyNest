# Vaccination schedule sources

Verified on **2026-07-22**. These reviewed definitions are stored locally; BabyNest does not fetch medical schedules at runtime. Dates are informational and must be confirmed with a clinician and the linked authority. Catch-up, contraindication, product-specific, pregnancy, travel and most risk-group pathways are intentionally not automated.

| Code | Authority and official schedule | Version | Model | Supported age | Important limitation |
|---|---|---|---|---|---|
| BG | [Bulgarian Ministry of Health — Ordinance No. 15](https://www.mh.government.bg/upload/4401/naredba15-ot-12-05-2005g-imunizatsii-bulgaria.pdf) | BG-2026.1 | National | Birth–17y | Conditional/risk recommendations need clinical review. |
| DE | [Robert Koch Institute / STIKO — Impfkalender 2026](https://edoc.rki.de/bitstream/handle/176904/13778/EB-27-2026_10-25646-14248.pdf) | DE-STIKO-2026.1 | National | Birth–17y | Catch-up and indication schedules excluded. |
| FR | [French Ministry of Health — Calendrier des vaccinations 2026](https://sante.gouv.fr/prevention-en-sante/preserver-sa-sante/vaccination/calendrier-vaccinal) | FR-2026.1 | National | Birth–18y | Special-risk and catch-up pathways excluded. |
| IT | [Italian Ministry of Health — PNPV calendar](https://www.salute.gov.it/new/it/tema/vaccinazioni/calendario-vaccinale/) | IT-PNPV-2023-2025.1 | Mixed | Birth–18y | Regional implementation and seasonal products vary. |
| ES | [Spanish Ministry of Health / CISNS — 2026 common calendar](https://www.sanidad.gob.es/areas/promocionPrevencion/vacunaciones/calendario/docs/CalendarioVacunacion_Todalavida.pdf) | ES-CISNS-2026.1 | Mixed | Birth–18y | Autonomous communities may vary timing/products. |
| GB | [UKHSA — Complete routine schedule from 1 January 2026](https://www.gov.uk/government/publications/the-complete-routine-immunisation-schedule/complete-routine-immunisation-schedule-from-1-january-2026) | GB-UKHSA-2026.1 | National | Birth–18y | Cohort transition rules require NHS confirmation. |
| US | [CDC — Child and Adolescent Schedule by Age](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age-compliant.html) | US-CDC-2025.2 | National | Birth–18y | July 2025 schedule is current under the stated 2026 court order; catch-up/risk-based pathways excluded. |
| CA | [Public Health Agency of Canada — Provincial/territorial schedules](https://www.canada.ca/en/public-health/services/immunization-vaccines/provincial-territorial-routine-vaccination-programs-infants-children.html) | CA-ON/QC/BC/AB-2026.1 | Regional | Birth–17y | Province required; grade-based delivery is represented by approximate age. |
| NL | [RIVM — National Immunisation Programme](https://www.rivm.nl/en/national-immunisation-programme) | NL-RVP-2026.1 | National | Birth–18y | Cohort transitions require RIVM confirmation. |
| BE | [FPS Public Health — Vaccination schedules](https://www.health.belgium.be/fr/schema-de-vaccination-1) | BE-2025.1 | Mixed | Birth–18y | Community programmes differ across Belgium. |
| AT | [Austrian Ministry / National Vaccination Board — Impfplan 2025/2026 v1.1](https://www.gesundheit.gv.at/linkresolution/link/37958) | AT-2025-2026.1 | National | Birth–18y | Indication/product pathways excluded. |
| CH | [Federal Office of Public Health / EKIF — Swiss Vaccination Plan 2026](https://www.bag.admin.ch/de/schweizerischer-impfplan) | CH-BAG-2026.1 | National | Birth–18y | Supplementary items are labelled optional; risk groups excluded. |
| GR | [Greek Ministry of Health — National Programme 2025](https://www.moh.gov.gr/articles/health/dieythynsh-dhmosias-ygieinhs/emboliasmoi/ethniko-programma-emboliasmwn-epe-paidiwn-kai-efhbwn/13267-laquo-ethniko-programma-emboliasmwn-paidiwn-kai-efhbwn-2025-xronodiagramma-kai-systaseis-raquo) | GR-2025.1 | National | Birth–18y | Risk-factor notes require clinical assessment. |
| RO | [Romanian Ministry of Health — National Vaccination Calendar 2025](https://www.ms.ro/ro/informatii-de-interes-public/campanii-informare-educare-comunicare/analiza-de-situatie-vaccinare-2025/) | RO-MOH-2025.1 | National | Birth–14y | Only national routine programme is generated. |
| PL | [Polish GIS / Ministry of Health — PSO 2026](https://www.gov.pl/web/gsse-warszawa/program-szczepien-ochronnych-na-2026-rok) | PL-PSO-2026.1 | National | Birth–19y | Alternative combination pathways and risk groups require review. |

## Canada regions

Ontario, Quebec, British Columbia and Alberta are independent definitions selected explicitly. No universal Canadian fallback is generated.

## Maintenance

Review every source at least annually and whenever an authority publishes an interim change. Version changes must use the existing review/apply reconciliation flow; they must never overwrite completed, manual, imported, postponed or skipped records.
