import { FoodSafetyDoc } from '../types/foodSafety';

/**
 * Generates an accurate, document-grounded response directly in the browser
 * when running on static hosts (such as GitHub Pages) where `/api/chat/stream` is unavailable.
 */
export function generateLocalComplianceResponse(
  query: string,
  documents: FoodSafetyDoc[],
  activeDoc?: FoodSafetyDoc | null
): string {
  const q = query.toLowerCase().trim();

  // Direct high-precision triggers for Receptionist Task Checklist (JNLD-CHK-FOH-REC-001)
  if (
    q.includes('receptionist') ||
    q.includes('jnld-chk-foh-rec-001') ||
    q.includes('rec-001') ||
    q.includes('station checklist') ||
    q.includes('ni hao') ||
    q.includes('899') ||
    q.includes('999') ||
    q.includes('birthday promo') ||
    q.includes('leftover') ||
    q.includes('outside food') ||
    q.includes('mushroom soup') ||
    q.includes('bill out')
  ) {
    return `### **JNLD-CHK-FOH-REC-001: Receptionist Task Checklist (Version 2)**
Official Front-of-House (FOH) Station Checklist from the Learning and Development Department covering the 8-stage guest journey:

* **I. Initial Greeting (Task 1.1):** Greet every guest warmly: *"Ni Hao! Welcome to Jiang Nan! Is this your first time dining with us po?"* (If returning: *"Welcome back po!"* | If first time: *"Welcome po!"*).
* **II. Guest Details & Waitlist (Tasks 2.1–2.2):** Confirm guest name, total pax, and preferred payment method (**Cash, Credit Card, Debit Card, or GCash**). Check table availability with the assigned Server. If full, log on the approved waitlist, provide estimated wait time, hand the menu, and monitor waiting guests.
* **III. Service & Menu Intro (Tasks 3.1–3.5):**
  - **Weekday vs. Weekend Package Rates:** Always lead with the **Hotpot with Grill Package** — **₱899/person on Weekdays (+5% service charge)** and **₱999/person on Weekends (+5% service charge)**.
  - **Hotpot-Only Rate (State ONLY if guest asks):** Weekdays Hotpot-only is **₱699** (+₱200 Grill = ₱899); Weekends Hotpot-only is **₱799** (+₱200 Grill = ₱999).
  - **Premium Meat Upgrade:** Offer optional **Premium Meat Selection** at **+₱200/person**.
  - **Allergen Screening:** Ask about food allergies/dietary restrictions, check the approved **Allergen Guide**, never give unverified info, and **write the specific allergen on the Bill Out form** for the Server.
* **IV. Promotions & Discounts (Tasks 4.1–4.2):**
  - **Birthday Promo:** **Exact Birthday Today** = **4 paying guests + celebrant FREE**; **Within Birth Month** = **5 paying guests + celebrant FREE** (verify valid ID & endorse to Bill Out form).
  - **Senior Citizen / PWD Discount:** Explain that **only the 12% VAT component is deducted** because the rate already reflects an unlimited dining promotion (verify valid card & ID for Bill Out).
* **V. Dining & Ordering Rules (Tasks 5.1–5.3):**
  - **Soup Selection:** **All soup bases are pork-based EXCEPT Mushroom Soup**. Guests may choose **up to two (2) soup flavors per table**.
  - **Initial Order:** Start with **up to three (3) plates of meat** for the initial order; reorders anytime via the **Additional Order Form** on the table. **Desserts and beverages are unlimited** and included.
* **VI. Dining Guidelines & Policies (Task 6.1):**
  - **Dining Time & Leftovers:** Up to **two (2) hours** dining time; **No Leftover Policy** carries a **₱1,000 charge** for excessive leftovers.
  - **Outside Food:** Allowed ONLY if the guest completes the **Updated Outside Food Waiver Form** before bringing it to the table.
* **VII & VIII. Server Turnover & Departure (Tasks 7.1–8.2):**
  - **Turnover Script to Server:** *"Table ___ po, [number] pax, [hotpot/grill], with/without allergen or special request."*
  - **Exit Receipt Check:** Politely verify and stamp the guest's **OR/Invoice (receipt)** before exit (if missing, courteously check with the Cashier first in a non-accusatory manner), then say: *"Xie xie! Thank you for dining with us at Jiang Nan Hotpot! See us again!"*`;
  }

  const tokens = q
    .replace(/[^a-z0-9#\-\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Score all documents against the query
  const scored = documents
    .map((doc) => {
      let score = 0;
      const codeLower = doc.code.toLowerCase();
      const titleLower = doc.title.toLowerCase();
      const summaryLower = doc.summary.toLowerCase();
      const tagsLower = doc.tags.map((t) => t.toLowerCase()).join(' ');
      const takeawaysLower = doc.keyTakeaways.join(' ').toLowerCase();
      const rulesLower = (doc.quickRules || [])
        .map((r) => `${r.title} ${r.rule}`)
        .join(' ')
        .toLowerCase();

      if (q.includes(codeLower) || codeLower.includes(q)) score += 30;
      if (activeDoc && doc.id === activeDoc.id) score += 8;

      for (const token of tokens) {
        if (codeLower.includes(token)) score += 15;
        if (titleLower.includes(token)) score += 10;
        if (tagsLower.includes(token)) score += 6;
        if (rulesLower.includes(token)) score += 5;
        if (takeawaysLower.includes(token)) score += 4;
        if (summaryLower.includes(token)) score += 3;
      }

      return { doc, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const topMatches = scored.slice(0, 3).map((s) => s.doc);

  if (topMatches.length > 0) {
    const primary = topMatches[0];
    const quickRulesMd =
      primary.quickRules && primary.quickRules.length > 0
        ? `\n\n### **Critical Standards & Thresholds (${primary.code})**\n` +
          primary.quickRules
            .slice(0, 5)
            .map((r) => `* **${r.title}:** ${r.rule}`)
            .join('\n')
        : '';

    const takeawaysMd =
      primary.keyTakeaways && primary.keyTakeaways.length > 0
        ? `\n\n### **Key Operational Rules**\n` +
          primary.keyTakeaways
            .slice(0, 6)
            .map((t) => `* ${t}`)
            .join('\n')
        : '';

    const relatedMd =
      topMatches.length > 1
        ? `\n\n### **Related Official Documents**\n` +
          topMatches
            .slice(1)
            .map((d) => `* **${d.code} — ${d.title}:** ${d.summary}`)
            .join('\n')
        : '';

    return `### **${primary.code}: ${primary.title}**\n${primary.summary}${quickRulesMd}${takeawaysMd}${relatedMd}`;
  }

  // Default comprehensive summary if no specific keywords matched
  return `### **L&D Virtual Support — Quick Compliance & Station Standards**
* **Receptionist Station Checklist (JNLD-CHK-FOH-REC-001):** Lead with Hotpot + Grill (**₱899 Weekday / ₱999 Weekend + 5% SC**; Hotpot-only ₱699/₱799 if asked; **+₱200** Premium Meat); Birthday (**4 paying exact day / 5 paying birth month**); Senior/PWD (**12% VAT deduction**); all soups pork-based except **Mushroom Soup** (max 2 flavors, 3 initial meat plates); **2-hr limit & ₱1,000 leftover fee**; Outside Food Waiver; verify & stamp OR/Invoice on exit.
* **Handwashing (IKQA-SOP#001):** Complete 6-step handwash for **40 to 60 seconds** + mandatory **Restroom Double Wash** (wash in restroom, then wash again at kitchen sink).
* **Cold Chain & 15-Minute Rule (IKQAP#003):** Chilled items (**0°C to 4°C**) and frozen items (**≤ -18°C**) must be transferred to cold storage within **15 minutes** of delivery.
* **Danger Zone (5°C to 60°C):** High-risk foods must never remain in the Temperature Danger Zone for more than **1 hour cumulative**.
* **FEFO over FIFO (IKQA-SOP#004):** First-Expiry, First-Out strictly overrides First-In, First-Out. Open items require a 7-part secondary shelf-life label within 5 minutes.
* **Towel & Board Color Coding (IKQAP#015 / IKQA-SOP#010):** White = clean wares; Blue = dining tables; Yellow = handwash sink; Green = kitchen prep; Red = restroom only.
* **Food Safety Act of 2013 (RA 10611):** Statutory compliance mandate overseen by DA, DOH-FDA, and LGU Sanitation units.`;
}
