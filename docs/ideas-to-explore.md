# Ideas a explorar

> Temas a **considerar**, no comprometidos. Esto **no es roadmap** — son ideas en bruto que pueden o no convertirse en features. No mencionar en pitch, README ni narrativa de producto hasta que se decidan.

---

## Hybrid houses + yield retenido por la plataforma

**Estado:** idea, no implementada. Hoy solo existen dos modalidades reales: **Co-Payment** y **Staking**. No se creó ninguna casa hybrid.

**La idea:** una casa que junta dinero y cuyo **yield queda generando en la plataforma** (en lugar de ir 100% al host o repartirse entre builders). Variantes a pensar:

- Casa hybrid = parte co-payment + parte staking en el mismo pool.
- El host recibe el principal en el release, pero el **yield se queda lockeado/generando a nivel plataforma** (potencial fuente de revenue del protocolo, más allá del 0.5% de fee).
- Distribución configurable del yield: host / builders / **plataforma**.

**Por qué está acá y no en roadmap:** hay que definir el modelo económico, las implicancias regulatorias de que la plataforma retenga yield, y la lógica de distribución en el `HackerHouseEscrow` (el enum `HouseType.HYBRID` existe en el contrato y `'hybrid'` está en el CHECK de `hacker_houses`, pero está **reservado y sin usar**).

**Preguntas abiertas:**
- ¿La plataforma reteniendo yield es revenue legítimo o fricción de confianza con los builders?
- ¿Cómo se comunica con transparencia (el builder sabe que su yield va a la plataforma)?
- ¿Se necesita un adapter de yield distinto, o el mismo `IYieldAdapter` con un `yieldDest = PLATFORM` nuevo?
