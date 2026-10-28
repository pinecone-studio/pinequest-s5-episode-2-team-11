/**
 * Блүми эгчийн сарын тэмдгийн мэдлэгийн сан — AI чатын system prompt-д орно.
 * Зөвхөн албан ёсны эх сурвалжид тулгуурласан баримт:
 *   ACOG Committee Opinion 651 "Menstruation in Girls and Adolescents: Using the Menstrual Cycle as a Vital Sign" (2015, reaffirmed)
 *   AAP (HealthyChildren.org) — puberty & first period
 *   WHO / UNICEF — Guidance on Menstrual Health and Hygiene (2019), menstrual health as a health & human-rights issue (WHO 2022)
 *   NHS (nhs.uk) — periods, period pain, PMS, heavy periods
 *   U.S. FDA — tampons & menstrual cups, Toxic Shock Syndrome
 *   CDC / Office on Women's Health (womenshealth.gov) — menstrual cycle, puberty
 * Эм, тунгийн мэдээлэл санаатайгаар оруулаагүй (апп-ын аюулгүй байдлын дүрэм).
 */
export const PERIOD_KNOWLEDGE = `PERIOD KNOWLEDGE BASE (from ACOG, AAP, WHO, UNICEF, NHS, U.S. FDA, CDC/OWH). Use only these facts for health information. If something is not covered here, say you're not sure and suggest asking a parent, school nurse or doctor.

1. What a period is
- A period (menstruation) is when the soft lining of the uterus (womb), which grew thicker during the month, leaves the body through the vagina as blood and tissue. It is a normal, healthy sign that the body is growing up. (OWH, NHS)
- The menstrual cycle is counted from the first day of one period to the first day of the next. Hormones (estrogen and progesterone) guide it. (OWH)
- WHO says menstrual health is part of overall health; periods are not dirty, not an illness and nothing to be ashamed of. (WHO 2022, UNICEF)

2. When periods start (first period = menarche)
- Most girls get their first period between ages 10 and 15; the average is about 12. Starting anywhere from about 9 to 15 can be normal. Every body has its own timing. (ACOG 651, AAP, NHS)
- Usual order of puberty: breast buds first (often age 8–13), then pubic/underarm hair and a growth spurt. The first period usually comes about 2–3 years after breasts begin to grow. (ACOG 651, AAP)
- 6–12 months before the first period, many girls notice clear or white discharge in their underwear. This is normal and is a sign the period may come soon. (AAP, NHS)
- The first period is often light — a few spots of red, pink or brown blood. (NHS)

3. What is normal in the first years (ACOG 651 — "the period is a vital sign")
- In teens, a normal cycle is 21–45 days long. It is very common for periods to be irregular for the first 1–2 years (sometimes even up to 3) because ovulation is not regular yet.
- A period usually lasts 2–7 days.
- Typical blood loss for a whole period is small — about 30–40 ml (roughly 2–3 tablespoons), even if it looks like more.
- Blood can be bright red, dark red or brown; small clots (smaller than a coin) can be normal. (NHS)
- Tracking periods on a calendar or app helps notice what is normal for you. (ACOG 651)

4. When to tell a parent and see a doctor (ACOG 651, NHS, FDA)
- No period by age 15, or no period 3 years after breasts started to grow.
- Breast growth or periods before age 8.
- A period that lasts more than 7 days.
- Very heavy bleeding: soaking through a pad or tampon every 1–2 hours, clots bigger than a coin, or needing to change pads at night many times.
- Cycles shorter than 21 days or longer than 45 days (after the first year), or periods that stop for 3 months after being regular.
- Pain so strong it keeps you home from school or doesn't get better with rest and warmth.
- Feeling dizzy, very tired or out of breath during periods.
- EMERGENCY (Toxic Shock Syndrome, FDA): sudden high fever, vomiting, diarrhea, a sunburn-like rash, dizziness or fainting while using a tampon or cup → take it out and get an adult and medical help right away (Mongolia: 103).

5. Period products (FDA, NHS, UNICEF)
- Pads stick inside underwear; most girls start with pads. Change about every 3–4 hours, or sooner if full. Night pads are longer.
- Period underwear and reusable cloth pads are also options; wash as instructed.
- Tampons go inside the vagina. They are safe for young people to use and do not change virginity. Change at least every 4–8 hours, never leave one in longer than 8 hours, and use the lowest absorbency needed (lowers TSS risk). Only use during the period.
- Menstrual cups: can be worn up to 12 hours; wash and follow instructions.
- Choose what feels comfortable — there is no "right" product. Ask a parent or trusted adult to help the first time.
- Wrap used pads in paper or the wrapper and put them in the bin. Never flush pads.
- School kit idea: 2–3 pads, a spare pair of underwear, wipes, a small bag.

6. Body care during a period (NHS, OWH)
- Shower or bathe as usual — washing hair and bathing during a period are fine and healthy (this is a myth that they're harmful).
- Wash the outside private area (vulva) with plain warm water. No douching, no scented soaps or sprays inside — the vagina cleans itself.
- Wash hands before and after changing a product.
- Blood stains come out best with cold water.

7. Cramps and other feelings (NHS, ACOG)
- Cramps (period pain) are caused by the uterus squeezing to push out the lining; chemicals called prostaglandins make it squeeze. Mild to moderate cramps on the first 1–3 days are common.
- Things that help: a warm (not hot) water bottle or heat pad on the tummy or lower back, a warm bath, gentle movement like walking, stretching or yoga, rest, drinking water.
- Pain medicine: some people take it, but ONLY a parent or doctor should decide. (Do not name medicines or doses.)
- Before or during a period some girls notice: tiredness, bloating, sore breasts, spots/acne, headaches, mood changes (feeling sad, cranky or teary). This is called PMS and is common. Sleep, movement, regular meals and talking about feelings help. (NHS)
- Feelings about periods — embarrassed, scared, excited, confused — are all normal.

8. Everyday life
- You can go to school, run, play sports, dance and exercise during a period; exercise can even ease cramps. (NHS, ACOG)
- Swimming is fine with a tampon or cup; pads don't work in water. (NHS)
- You can eat normal food, including cold food and drinks — avoiding cold food is a myth. Iron-rich foods (meat, beans, green vegetables) and enough water are good for growing bodies. (No diets or calorie talk.)
- Other people cannot tell you have a period unless you tell them.
- Sleep: children 6–12 need 9–12 hours; teens 8–10 hours. (AAP)

9. Common myths (WHO, UNICEF, NHS)
- Myth: periods are dirty or shameful → False. They are a healthy body process.
- Myth: you can't bathe, wash hair, exercise, or eat cold food → False.
- Myth: tampons make you "lose" virginity → False.
- Myth: everyone gets their period at the same age → False; between about 9 and 15 is normal.
- Myth: girls can't do things during their period → False. Girls can do everything.

10. Bigger questions
- If asked "Can I get pregnant now?": explain gently and briefly that a period means the body is growing and becoming able to have a baby one day when grown up, and that this is a great question to talk about with mom or another trusted adult. Do not go into sexual detail.
- Boys and dads can learn about periods too; it's good when families talk openly. (UNICEF)`;
