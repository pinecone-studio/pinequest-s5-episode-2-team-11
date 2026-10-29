/**
 * Асран хамгаалагчийн AI туслахын мэдлэгийн сан — /api/ai-ийн parent_chat system prompt-д орно.
 * Зөвхөн дараах албан ёсны эх сурвалжид тулгуурласан:
 *   UNESCO et al. (2018) International technical guidance on sexuality education (ITGSE), Key concept 6.3 Puberty
 *   UNESCO (2014) Good policy and practice in health education, Booklet 9: Puberty education & menstrual hygiene management
 *   UNICEF (2019) Guidance on menstrual health and hygiene
 *   WHO (2022) Statement on menstrual health and rights (Human Rights Council, 50th session)
 *   WHO fact sheet: Mental health of adolescents
 * Эм, тун, онош санаатайгаар оруулаагүй (апп-ын аюулгүй байдлын дүрэм).
 */
export const GUARDIAN_KNOWLEDGE = `GUARDIAN KNOWLEDGE BASE (from UNESCO, UNICEF and WHO). Use these points when advising parents and guardians. Never present them as your own opinion; when it helps, say which organisation the advice comes from (e.g. "WHO says…", "UNESCO recommends…").

1. Why the guardian matters (UNICEF 2019, UNESCO ITGSE 2018)
- Parents and caregivers are among the biggest influencers and sources of information and support for girls about their period. (UNICEF 2019)
- Parents and family are the primary source of information, support and care in shaping a healthy approach to the body and relationships; schools are meant to complement parents, not replace them. (UNESCO ITGSE 2018)
- Many parents find these talks hard, even while agreeing it is their responsibility. Many value outside help with what to say and how to react. Feeling awkward is normal and is not a reason to stay silent. (UNESCO Booklet 9, ITGSE)
- Parents may lack basic information about menstruation or the confidence to start the conversation at menarche, and may pass on harmful beliefs without meaning to. Learning the facts first helps. (UNICEF 2019)
- Adults often explain puberty the same way their own parents did. It is fine to do it differently and more openly. (UNESCO Booklet 9)

2. Prepare her BEFORE the first period (UNESCO Booklet 9, ITGSE)
- Studies show many girls start menstruating with no idea what is happening or why, which causes fear and anxiety. Talking before the first period prevents this. (UNESCO Booklet 9, ITGSE)
- UNESCO's goals for ages 9–12: she can describe puberty and the main physical and emotional changes; knows how to get, use and throw away pads and other products; understands hygiene; knows how to find trustworthy information; and sees menstruation as normal and natural, not something to hide or be ashamed of. (ITGSE 6.3)
- Practical prep a guardian can do: keep pads at home and in her school bag, show her where they are, explain how to use and wrap/dispose of them, and agree on how she can tell you (or ask for supplies) without embarrassment.
- Short, repeated, everyday conversations work better than one big "talk".

3. Shame, stigma and myths (WHO 2022, ITGSE, UNESCO Booklet 9)
- WHO says menstruation should be framed as a health and human-rights issue, not a "hygiene" issue, and should be seen as positive and healthy. (WHO 2022)
- Shame, embarrassment and lack of supplies affect girls' education, health and equality. (WHO 2022)
- Girls often miss school or avoid participating (standing up in class, writing on the board) because of cramps, lack of supplies, poor toilets, unsupportive surroundings and fear of leaks or stains. A spare-supplies kit, a dark spare pair of trousers or underwear, and permission to go to the toilet when needed reduce this. (UNESCO Booklet 9)
- In some places, taboos make girls eat or sleep apart or miss school during their period. These practices are not needed for health and add to shame. (ITGSE)
- Gender inequality feeds girls' shame and fear about periods; calm, matter-of-fact family talk counters it. (ITGSE 6.3)

4. Fathers, brothers and boys (UNESCO Booklet 9, UNICEF 2019, ITGSE)
- Puberty affects boys too; leaving boys and men out makes support for girls less effective. Brothers should learn the basics so they don't tease, and so home feels safe. (UNESCO Booklet 9, UNICEF 2019)
- A father or male guardian can support just as well: stay calm and practical, buy supplies without fuss, never joke about periods or her body, and offer a trusted woman (aunt, grandmother, teacher, school doctor) if she prefers.

5. What a good conversation looks like (synthesised from the sources above)
- Listen first, stay calm, don't laugh, scold or show disgust. Thank her for telling you.
- Use correct, simple words (period, uterus, pad) instead of avoiding them.
- Respect her privacy: don't tell relatives or others about her period without her OK.
- Answer what she asks; if you don't know, say "let's find out together" and use trusted sources (school nurse, family doctor, health centre).
- Don't link the first period to "now you are a woman / ready for marriage" or to danger from boys; focus on health and normal growing up.

6. Emotions and mental health in adolescence (WHO fact sheet)
- About 1 in 7 young people aged 10–19 has a mental health condition, and most are not recognised or treated. Anxiety and depression are the most common. (WHO)
- Warning signs worth noticing: sudden, unexpected mood changes that last, pulling away from friends or family, loneliness, problems at school. (WHO)
- What protects her: a supportive family, enough sleep, regular physical activity, and learning to cope with problems and handle emotions. Harsh parenting, violence (including sexual violence) and bullying are major risks. (WHO)
- Mood changes around the period can be normal, but long-lasting sadness, withdrawal or talk of self-harm are not "just hormones" — encourage professional help early.
- If she mentions self-harm, wanting to die, abuse or being in danger: take it seriously, stay with her, and contact a doctor or emergency services (102 police, 103 ambulance in Mongolia).

7. When to see a health worker (consistent with WHO's call for "competent and empathic care")
- No period by about age 15, or no breast development by about 13.
- Very heavy bleeding (soaking a pad every 1–2 hours), periods longer than 7 days, or pain that stops her from going to school or doing normal activities.
- Fainting, severe pain, or any worry the guardian has. Never suggest specific medicines or doses — refer to a doctor or pharmacist.`;
