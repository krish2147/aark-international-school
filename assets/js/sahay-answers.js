/* Sahay's built-in answers: free, no AI needed.
 *
 * Every answer comes from the school's published pages. When fees, dates or
 * contact details change on the site, change them here too.
 *
 * Each topic has:
 *   chip   – the button label shown to parents
 *   words  – words that point to this topic (English, Hinglish, Hindi, Gujarati).
 *            A word ending in * also matches longer words (fee* matches fees).
 *            Put the strongest words in `strong`; they count double.
 *   en/hi/gu – the answer in English, Hindi and Gujarati. Sahay replies in the
 *            script the parent typed in. Use "- " at the start of a line for a bullet.
 *   next   – topics offered as buttons after this answer.
 */
window.SAHAY_ANSWERS = {
  phone: '+91 99091 15550',
  topics: {
    fees: {
      chip: 'Fees 2026–27',
      strong: ['fee*', 'tuition', 'फीस', 'फ़ीस', 'शुल्क', 'ફી', 'ફીસ'],
      words: ['cost*', 'charge*', 'price', 'kitni', 'kharch*', 'paisa', 'खर्च', 'ખર્ચ', 'કેટલી', 'कितनी'],
      en: 'Annual fees for 2026–27, fixed by the Fee Regulation Committee (Vadodara):\n- Nursery, Junior KG, Senior KG: ₹45,000\n- Grades I–VIII: ₹50,000 per grade\n- Grades IX–XII: please contact the school\n\nThe admission fee equals one month\'s tuition fee where applicable, and the application fee is ₹1,000 (non-refundable). Please confirm the payment schedule with the admissions office before paying. Details: /admissions.html',
      hi: '2026–27 की वार्षिक फीस (फी रेगुलेशन कमेटी, वडोदरा द्वारा तय):\n- नर्सरी, जूनियर KG, सीनियर KG: ₹45,000\n- कक्षा 1 से 8: ₹50,000 प्रति कक्षा\n- कक्षा 9 से 12: कृपया स्कूल से संपर्क करें\n\nजहाँ लागू हो, प्रवेश शुल्क एक महीने की ट्यूशन फीस के बराबर है। आवेदन शुल्क ₹1,000 है (वापस नहीं होता)। भुगतान से पहले कृपया एडमिशन ऑफिस से भुगतान का शेड्यूल पक्का कर लें। विवरण: /admissions.html',
      gu: '2026–27 ની વાર્ષિક ફી (ફી રેગ્યુલેશન કમિટી, વડોદરા દ્વારા નક્કી):\n- નર્સરી, જુનિયર KG, સિનિયર KG: ₹45,000\n- ધોરણ 1 થી 8: ₹50,000 દરેક ધોરણ માટે\n- ધોરણ 9 થી 12: કૃપા કરીને શાળાનો સંપર્ક કરો\n\nજ્યાં લાગુ પડે ત્યાં પ્રવેશ ફી એક મહિનાની ટ્યુશન ફી જેટલી છે. અરજી ફી ₹1,000 છે (પરત મળતી નથી). ચુકવણી પહેલાં કૃપા કરીને એડમિશન ઓફિસ પાસેથી ચુકવણીનું સમયપત્રક નક્કી કરી લો. વિગતો: /admissions.html',
      next: ['apply', 'age', 'visit']
    },
    age: {
      chip: 'Age criteria',
      strong: ['age', 'eligib*', 'umar', 'umr', 'उम्र', 'आयु', 'ઉંમર', 'વય'],
      words: ['criteria', 'how old', 'years old', 'yogyata', 'योग्यता', 'પાત્રતા'],
      en: 'Age criteria for 2026–27 (age as on 31 May 2026):\n- Nursery: 3+\n- Junior KG: 4+\n- Senior KG: 5+\n- Grade 1: 6+\n\nFor other grades, the admissions team confirms eligibility individually. Call +91 99091 15550.',
      hi: '2026–27 के लिए उम्र (31 मई 2026 को):\n- नर्सरी: 3+ वर्ष\n- जूनियर KG: 4+ वर्ष\n- सीनियर KG: 5+ वर्ष\n- कक्षा 1: 6+ वर्ष\n\nबाकी कक्षाओं के लिए एडमिशन टीम हर बच्चे की योग्यता अलग से बताती है। कॉल करें: +91 99091 15550',
      gu: '2026–27 માટે ઉંમર (31 મે 2026ના રોજ):\n- નર્સરી: 3+ વર્ષ\n- જુનિયર KG: 4+ વર્ષ\n- સિનિયર KG: 5+ વર્ષ\n- ધોરણ 1: 6+ વર્ષ\n\nબાકીના ધોરણો માટે એડમિશન ટીમ દરેક બાળકની પાત્રતા અલગથી જણાવે છે. ફોન કરો: +91 99091 15550',
      next: ['apply', 'fees', 'documents']
    },
    apply: {
      chip: 'How to apply',
      strong: ['apply', 'application', 'procedure', 'process', 'enrol*', 'register*', 'आवेदन', 'प्रक्रिया', 'અરજી', 'પ્રક્રિયા'],
      words: ['admission*', 'form', 'dakhla', 'dakhila', 'pravesh', 'kaise', 'kevi rite', 'प्रवेश', 'दाखिला', 'एडमिशन', 'કેવી રીતે', 'પ્રવેશ', 'એડમિશન'],
      en: 'Admission takes four simple steps:\n- Visit the campus (recommended first)\n- Apply online and pay the ₹1,000 application fee\n- A short, friendly interaction with the school (not an exam)\n- Receive the result and confirm the seat\n\nApply online for Nursery to Grade 8: https://aarkintschool-forms.zeroq.net\nFor Grades 9–12, please complete admission at the school. Submitting the form does not by itself confirm admission.',
      hi: 'प्रवेश के चार आसान कदम:\n- पहले कैंपस देखने आएँ (सलाह दी जाती है)\n- ऑनलाइन आवेदन करें और ₹1,000 आवेदन शुल्क भरें\n- स्कूल के साथ एक छोटी, सहज बातचीत (यह परीक्षा नहीं है)\n- परिणाम मिलने पर सीट पक्की करें\n\nनर्सरी से कक्षा 8 के लिए ऑनलाइन आवेदन: https://aarkintschool-forms.zeroq.net\nकक्षा 9 से 12 के लिए प्रवेश स्कूल में जाकर होता है। केवल फॉर्म भरने से प्रवेश पक्का नहीं होता।',
      gu: 'પ્રવેશના ચાર સરળ પગલાં:\n- પહેલાં કેમ્પસની મુલાકાત લો (ભલામણ કરેલ)\n- ઓનલાઇન અરજી કરો અને ₹1,000 અરજી ફી ભરો\n- શાળા સાથે ટૂંકી, સહજ વાતચીત (આ પરીક્ષા નથી)\n- પરિણામ મળ્યા પછી સીટ પાકી કરો\n\nનર્સરીથી ધોરણ 8 માટે ઓનલાઇન અરજી: https://aarkintschool-forms.zeroq.net\nધોરણ 9 થી 12 માટે પ્રવેશ શાળામાં રૂબરૂ થાય છે. ફક્ત ફોર્મ ભરવાથી પ્રવેશ પાકો થતો નથી.',
      next: ['documents', 'fees', 'visit']
    },
    documents: {
      chip: 'Documents',
      strong: ['document*', 'aadhaar', 'aadhar', 'birth certificate', 'दस्तावेज', 'डॉक्यूमेंट', 'दस्तावेज़', 'દસ્તાવેજ', 'ડોક્યુમેન્ટ'],
      words: ['papers', 'certificate*', 'proof', 'kagaz', 'कागज', 'आधार', 'કાગળ', 'આધાર'],
      en: 'Please keep these ready:\n- Application form\n- Birth certificate\n- Aadhaar documents\n- Residential proof\n- Immunisation details\n- Previous-school records, where applicable\n\nUse the child\'s name exactly as on the birth certificate or passport. Details: /admissions.html',
      hi: 'कृपया ये दस्तावेज़ तैयार रखें:\n- आवेदन फॉर्म\n- जन्म प्रमाणपत्र\n- आधार दस्तावेज़\n- निवास का प्रमाण\n- टीकाकरण का विवरण\n- पिछले स्कूल के रिकॉर्ड (जहाँ लागू हो)\n\nबच्चे का नाम ठीक वैसा ही लिखें जैसा जन्म प्रमाणपत्र या पासपोर्ट में है। विवरण: /admissions.html',
      gu: 'કૃપા કરીને આ દસ્તાવેજો તૈયાર રાખો:\n- અરજી ફોર્મ\n- જન્મ પ્રમાણપત્ર\n- આધાર દસ્તાવેજો\n- રહેઠાણનો પુરાવો\n- રસીકરણની વિગતો\n- અગાઉની શાળાના રેકોર્ડ (જ્યાં લાગુ પડે)\n\nબાળકનું નામ જન્મ પ્રમાણપત્ર અથવા પાસપોર્ટમાં હોય તે જ રીતે લખો. વિગતો: /admissions.html',
      next: ['apply', 'age']
    },
    visit: {
      chip: 'Book a visit',
      strong: ['visit*', 'tour', 'want to see', 'see the campus', 'see the school', 'mulakat', 'मुलाकात', 'विजिट', 'મુલાકાત', 'વિઝિટ'],
      words: ['see the school', 'see campus', 'come to school', 'meet', 'appointment', 'dekhne', 'देखने', 'જોવા'],
      en: 'You\'re welcome to visit! Share your details in the campus visit form and the school team will call you to fix a time: /index.html#visit\nOr call +91 99091 15550 (office 9:00 AM – 12:00 PM).',
      hi: 'आपका स्वागत है! कैंपस विज़िट फॉर्म में अपनी जानकारी भरें, स्कूल की टीम आपको समय तय करने के लिए कॉल करेगी: /index.html#visit\nया कॉल करें: +91 99091 15550 (ऑफिस: सुबह 9 से दोपहर 12 बजे)।',
      gu: 'આપનું સ્વાગત છે! કેમ્પસ મુલાકાત ફોર્મમાં તમારી વિગતો ભરો, શાળાની ટીમ સમય નક્કી કરવા તમને ફોન કરશે: /index.html#visit\nઅથવા ફોન કરો: +91 99091 15550 (ઓફિસ: સવારે 9 થી બપોરે 12).',
      next: ['contact', 'apply']
    },
    contact: {
      chip: 'Contact & address',
      strong: ['contact', 'phone', 'address', 'location', 'email', 'directions', 'sampark', 'संपर्क', 'पता', 'फोन', 'फ़ोन', 'સંપર્ક', 'સરનામું', 'ફોન'],
      words: ['number', 'call', 'where', 'map', 'office hours', 'kahan', 'kya', 'नंबर', 'कहाँ', 'कहां', 'નંબર', 'ક્યાં'],
      en: 'AARK International School\nNr. Shyam Icon, Bhayli–Sevasi Ring Road, Sevasi, Vadodara, Gujarat 391101\n- Phone: +91 99091 15550\n- Email: info@theaarkinternational.com\n- Office hours: 9:00 AM – 12:00 PM\n\nMap and directions: /index.html#visit',
      hi: 'AARK International School\nश्याम आइकन के पास, भायली–सेवासी रिंग रोड, सेवासी, वडोदरा, गुजरात 391101\n- फोन: +91 99091 15550\n- ईमेल: info@theaarkinternational.com\n- ऑफिस का समय: सुबह 9 से दोपहर 12 बजे\n\nनक्शा और रास्ता: /index.html#visit',
      gu: 'AARK International School\nશ્યામ આઇકન પાસે, ભાયલી–સેવાસી રિંગ રોડ, સેવાસી, વડોદરા, ગુજરાત 391101\n- ફોન: +91 99091 15550\n- ઇમેઇલ: info@theaarkinternational.com\n- ઓફિસનો સમય: સવારે 9 થી બપોરે 12\n\nનકશો અને રસ્તો: /index.html#visit',
      next: ['visit', 'timings']
    },
    transport: {
      chip: 'Transport',
      strong: ['transport*', 'bus', 'buses', 'van', 'pickup', 'pick up', 'route*', 'बस', 'वैन', 'ट्रांसपोर्ट', 'બસ', 'વાન', 'ટ્રાન્સપોર્ટ'],
      words: ['drop', 'vehicle', 'travel', 'वाहन', 'વાહન'],
      en: 'The school does not run its own buses or vans, but a transport facilitator works with the school. The admissions office will share their contact details. Please confirm routes, timings and charges directly with the facilitator. Call +91 99091 15550. More: /transport.html',
      hi: 'स्कूल की अपनी बसें या वैन नहीं हैं, लेकिन एक ट्रांसपोर्ट सेवा स्कूल के साथ जुड़ी है। एडमिशन ऑफिस उनका संपर्क देगा। रूट, समय और शुल्क सीधे उनसे पक्का करें। कॉल करें: +91 99091 15550। ज़्यादा जानकारी: /transport.html',
      gu: 'શાળાની પોતાની બસ કે વાન નથી, પરંતુ એક ટ્રાન્સપોર્ટ સેવા શાળા સાથે જોડાયેલી છે. એડમિશન ઓફિસ તેમનો સંપર્ક આપશે. રૂટ, સમય અને ચાર્જ સીધા તેમની પાસેથી નક્કી કરો. ફોન કરો: +91 99091 15550. વધુ માહિતી: /transport.html',
      next: ['contact', 'fees']
    },
    curriculum: {
      chip: 'Curriculum',
      strong: ['curriculum', 'syllabus', 'board', 'cbse', 'nep', 'पाठ्यक्रम', 'सिलेबस', 'बोर्ड', 'અભ્યાસક્રમ', 'સિલેબસ', 'બોર્ડ'],
      words: ['teaching', 'study', 'studies', 'method', 'subjects', 'padhai', 'पढ़ाई', 'પઢાઈ', 'અભ્યાસ'],
      en: 'AARK is a CBSE school (affiliation no. 430650) following NEP and NCF standards. Learning is project-based and hands-on, with one connected journey from Nursery to Grade 12, building curiosity, character and confidence. More: /curriculum.html',
      hi: 'AARK एक CBSE स्कूल है (एफिलिएशन नं. 430650), जो NEP और NCF मानकों का पालन करता है। पढ़ाई प्रोजेक्ट-आधारित और व्यावहारिक है, और नर्सरी से कक्षा 12 तक एक जुड़ी हुई यात्रा है। ज़्यादा जानकारी: /curriculum.html',
      gu: 'AARK એક CBSE શાળા છે (એફિલિએશન નં. 430650), જે NEP અને NCF ધોરણોને અનુસરે છે. અભ્યાસ પ્રોજેક્ટ આધારિત અને વ્યવહારુ છે, અને નર્સરીથી ધોરણ 12 સુધી એક જોડાયેલી સફર છે. વધુ માહિતી: /curriculum.html',
      next: ['activities', 'campus']
    },
    activities: {
      chip: 'Sports & activities',
      strong: ['sport*', 'swim*', 'karate', 'skating', 'activit*', 'robotic*', 'खेल', 'तैराकी', 'गतिविधि', 'રમત', 'સ્વિમિંગ', 'પ્રવૃત્તિ'],
      words: ['music', 'dance', 'art', 'arts', 'yoga', 'extra', 'games', 'संगीत', 'योग', 'સંગીત', 'યોગ'],
      en: 'Beyond the classroom, students enjoy:\n- Swimming, karate and skating (at different age levels)\n- Visual and performing arts\n- AI & robotics\n- Farming and practical learning\n- Yoga and meditation\n- Cultural, library and science-lab activities\n\nMore: /student-life.html',
      hi: 'कक्षा के अलावा बच्चे इनमें भाग लेते हैं:\n- तैराकी, कराटे और स्केटिंग (उम्र के अनुसार)\n- कला, संगीत और प्रदर्शन कला\n- AI और रोबोटिक्स\n- खेती और व्यावहारिक सीख\n- योग और ध्यान\n- सांस्कृतिक, लाइब्रेरी और साइंस-लैब गतिविधियाँ\n\nज़्यादा जानकारी: /student-life.html',
      gu: 'વર્ગખંડ ઉપરાંત બાળકો આમાં ભાગ લે છે:\n- સ્વિમિંગ, કરાટે અને સ્કેટિંગ (ઉંમર પ્રમાણે)\n- કલા, સંગીત અને પર્ફોર્મિંગ આર્ટ્સ\n- AI અને રોબોટિક્સ\n- ખેતી અને વ્યવહારુ શિક્ષણ\n- યોગ અને ધ્યાન\n- સાંસ્કૃતિક, લાઇબ્રેરી અને સાયન્સ-લેબ પ્રવૃત્તિઓ\n\nવધુ માહિતી: /student-life.html',
      next: ['campus', 'curriculum']
    },
    campus: {
      chip: 'Campus',
      strong: ['facilit*', 'infrastructure', 'lab', 'labs', 'library', 'कैंपस', 'सुविधा', 'लैब', 'लाइब्रेरी', 'કેમ્પસ', 'સુવિધા', 'લેબ', 'લાઇબ્રેરી'],
      words: ['campus', 'classroom*', 'building', 'cafeteria', 'canteen', 'ground', 'pool', 'कैंटीन', 'કેન્ટીન'],
      en: 'The low-rise campus in Sevasi has 22 classrooms, 8 labs, an AI & robotics lab, a library, arts and music spaces, sports facilities with swimming, a cafeteria, green outdoor areas, a musical wall and an adventure zone for younger children. More: /campus-detail.html',
      hi: 'सेवासी में स्थित कैंपस में 22 कक्षाएँ, 8 लैब, AI और रोबोटिक्स लैब, लाइब्रेरी, कला और संगीत के स्थान, तैराकी सहित खेल सुविधाएँ, कैफेटेरिया, हरे-भरे खुले स्थान, म्यूज़िकल वॉल और छोटे बच्चों के लिए एडवेंचर ज़ोन है। ज़्यादा जानकारी: /campus-detail.html',
      gu: 'સેવાસીમાં આવેલા કેમ્પસમાં 22 વર્ગખંડ, 8 લેબ, AI અને રોબોટિક્સ લેબ, લાઇબ્રેરી, કલા અને સંગીતની જગ્યાઓ, સ્વિમિંગ સાથે રમતગમતની સુવિધાઓ, કાફેટેરિયા, લીલીછમ ખુલ્લી જગ્યાઓ, મ્યુઝિકલ વોલ અને નાનાં બાળકો માટે એડવેન્ચર ઝોન છે. વધુ માહિતી: /campus-detail.html',
      next: ['activities', 'visit']
    },
    grades: {
      chip: 'Classes & seats',
      strong: ['seat*', 'admission open', 'admissions open', 'which class', 'classes', 'grades', 'सीट', 'સીટ'],
      words: ['open', 'session', 'available', 'nursery', 'standard*', 'कक्षा', 'ધોરણ', 'नर्सरी', 'નર્સરી'],
      en: 'AARK has classes from Nursery to Grade 12 (CBSE Senior Secondary). Admissions for 2026–27 are open for all grades, subject to seat availability. Apply online for Nursery to Grade 8: https://aarkintschool-forms.zeroq.net\nFor Grades 9–12, please apply at the school. For current seat availability, call +91 99091 15550.',
      hi: 'AARK में नर्सरी से कक्षा 12 तक पढ़ाई होती है (CBSE सीनियर सेकेंडरी)। 2026–27 के लिए सभी कक्षाओं में प्रवेश खुले हैं, सीटें उपलब्ध होने पर। नर्सरी से कक्षा 8 के लिए ऑनलाइन आवेदन: https://aarkintschool-forms.zeroq.net\nकक्षा 9 से 12 के लिए स्कूल में आवेदन करें। सीटों की जानकारी के लिए कॉल करें: +91 99091 15550',
      gu: 'AARKમાં નર્સરીથી ધોરણ 12 સુધીના વર્ગો છે (CBSE સિનિયર સેકન્ડરી). 2026–27 માટે બધા ધોરણોમાં પ્રવેશ ચાલુ છે, સીટ ઉપલબ્ધ હોય તો. નર્સરીથી ધોરણ 8 માટે ઓનલાઇન અરજી: https://aarkintschool-forms.zeroq.net\nધોરણ 9 થી 12 માટે શાળામાં અરજી કરો. સીટની માહિતી માટે ફોન કરો: +91 99091 15550',
      next: ['apply', 'age', 'fees']
    },
    timings: {
      chip: 'School timings',
      strong: ['timing*', 'school time', 'school hours', 'समय', 'टाइम', 'સમય', 'ટાઇમ'],
      words: ['time', 'start', 'holiday*', 'vacation', 'calendar', 'छुट्टी', 'રજા'],
      en: 'School timings and the holiday calendar aren\'t published on the website yet. Please call +91 99091 15550 (office 9:00 AM – 12:00 PM) and the team will help. The 2026–27 session began on 6 April 2026.',
      hi: 'स्कूल का समय और छुट्टियों का कैलेंडर अभी वेबसाइट पर नहीं है। कृपया कॉल करें: +91 99091 15550 (ऑफिस: सुबह 9 से दोपहर 12 बजे), टीम आपकी मदद करेगी। 2026–27 सत्र 6 अप्रैल 2026 से शुरू हुआ।',
      gu: 'શાળાનો સમય અને રજાઓનું કેલેન્ડર હજુ વેબસાઇટ પર નથી. કૃપા કરીને ફોન કરો: +91 99091 15550 (ઓફિસ: સવારે 9 થી બપોરે 12), ટીમ તમને મદદ કરશે. 2026–27 સત્ર 6 એપ્રિલ 2026થી શરૂ થયું છે.',
      next: ['contact', 'visit']
    },
    principal: {
      chip: 'Principal',
      strong: ['principal', 'counsel*', 'प्रिंसिपल', 'प्रधानाचार्य', 'પ્રિન્સિપાલ', 'આચાર્ય'],
      words: ['head', 'director', 'management', 'trust', 'owner', 'ट्रस्ट', 'ટ્રસ્ટ'],
      en: 'The Principal is Dr. Mukesh Udasi (PhD Maths, M.Sc, B.Ed). The school counsellor is Dimpal Prajapati. AARK is managed by the Daffodils Education Trust.',
      hi: 'स्कूल के प्रिंसिपल डॉ. मुकेश उदासी (PhD गणित, M.Sc, B.Ed) हैं। स्कूल काउंसलर डिंपल प्रजापति हैं। AARK का संचालन डैफ़ोडिल्स एजुकेशन ट्रस्ट करता है।',
      gu: 'શાળાના પ્રિન્સિપાલ ડૉ. મુકેશ ઉદાસી (PhD ગણિત, M.Sc, B.Ed) છે. શાળાના કાઉન્સેલર ડિમ્પલ પ્રજાપતિ છે. AARKનું સંચાલન ડેફોડિલ્સ એજ્યુકેશન ટ્રસ્ટ કરે છે.',
      next: ['curriculum', 'contact']
    },
    affiliation: {
      chip: 'CBSE affiliation',
      strong: ['affiliat*', 'recogni*', 'disclosure', 'approved', 'मान्यता', 'માન્યતા', 'સંલગ્ન'],
      words: ['certified', 'noc', 'legal', 'official'],
      en: 'AARK is affiliated to CBSE at the Senior Secondary level: affiliation no. 430650, school no. 11842, valid from 1 April 2026 to 31 March 2031. It is managed by the Daffodils Education Trust. Full details: /disclosures.html',
      hi: 'AARK सीनियर सेकेंडरी स्तर तक CBSE से संबद्ध है: एफिलिएशन नं. 430650, स्कूल नं. 11842, 1 अप्रैल 2026 से 31 मार्च 2031 तक मान्य। संचालन डैफ़ोडिल्स एजुकेशन ट्रस्ट द्वारा। पूरा विवरण: /disclosures.html',
      gu: 'AARK સિનિયર સેકન્ડરી સ્તર સુધી CBSE સાથે સંલગ્ન છે: એફિલિએશન નં. 430650, સ્કૂલ નં. 11842, 1 એપ્રિલ 2026 થી 31 માર્ચ 2031 સુધી માન્ય. સંચાલન ડેફોડિલ્સ એજ્યુકેશન ટ્રસ્ટ દ્વારા. પૂરી વિગતો: /disclosures.html',
      next: ['curriculum', 'campus']
    },
    safety: {
      chip: 'Safety',
      strong: ['safety', 'safe', 'security', 'secure', 'सुरक्षा', 'સુરક્ષા', 'સલામતી'],
      words: ['fire', 'cctv', 'guard', 'hygiene', 'water'],
      en: 'Student safety and well-being are priorities at AARK. The campus holds a fire safety certificate (valid to 28 May 2028), a building safety certificate, and a health, water and sanitation certificate. Details: /disclosures.html',
      hi: 'AARK में बच्चों की सुरक्षा और भलाई सबसे पहले है। कैंपस के पास फायर सेफ्टी प्रमाणपत्र (28 मई 2028 तक मान्य), बिल्डिंग सेफ्टी प्रमाणपत्र और स्वास्थ्य, पानी व स्वच्छता प्रमाणपत्र है। विवरण: /disclosures.html',
      gu: 'AARKમાં બાળકોની સલામતી અને સુખાકારી સૌથી પહેલાં છે. કેમ્પસ પાસે ફાયર સેફ્ટી પ્રમાણપત્ર (28 મે 2028 સુધી માન્ય), બિલ્ડિંગ સેફ્ટી પ્રમાણપત્ર અને આરોગ્ય, પાણી અને સ્વચ્છતા પ્રમાણપત્ર છે. વિગતો: /disclosures.html',
      next: ['campus', 'visit']
    },
    careers: {
      chip: 'Jobs at AARK',
      strong: ['job*', 'career*', 'vacanc*', 'hiring', 'recruit*', 'नौकरी', 'भर्ती', 'નોકરી', 'ભરતી'],
      words: ['teacher post', 'resume', 'cv', 'work at'],
      en: 'Teaching and staff vacancies are listed on AARK\'s careers page, where you can apply with your resume. The HR team reviews applications and contacts applicants about next steps: /careers.html',
      hi: 'शिक्षक और स्टाफ की नौकरियाँ AARK के करियर पेज पर हैं, जहाँ आप अपना रिज़्यूमे भेज सकते हैं। HR टीम आवेदन देखकर संपर्क करती है: /careers.html',
      gu: 'શિક્ષક અને સ્ટાફની નોકરીઓ AARKના કરિયર પેજ પર છે, જ્યાં તમે તમારો રિઝ્યુમ મોકલી શકો છો. HR ટીમ અરજી જોઈને સંપર્ક કરે છે: /careers.html',
      next: ['contact']
    }
  },

  // Said when nothing matches. Sahay adds topic buttons underneath.
  unknown: {
    en: 'I don\'t have that answer yet. Please call the school on +91 99091 15550 (office 9:00 AM – 12:00 PM), or pick a topic below.',
    hi: 'इसका जवाब अभी मेरे पास नहीं है। कृपया स्कूल को कॉल करें: +91 99091 15550 (ऑफिस: सुबह 9 से दोपहर 12 बजे), या नीचे कोई विषय चुनें।',
    gu: 'આનો જવાબ હજુ મારી પાસે નથી. કૃપા કરીને શાળાને ફોન કરો: +91 99091 15550 (ઓફિસ: સવારે 9 થી બપોરે 12), અથવા નીચે કોઈ વિષય પસંદ કરો.'
  },
  greeting: {
    words: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'kem cho', 'good morning', 'नमस्ते', 'नमस्कार', 'નમસ્તે', 'કેમ છો'],
    en: 'Namaste! What would you like to know about AARK? Pick a topic below or type your question.',
    hi: 'नमस्ते! आप AARK के बारे में क्या जानना चाहेंगे? नीचे कोई विषय चुनें या अपना सवाल लिखें।',
    gu: 'નમસ્તે! તમે AARK વિશે શું જાણવા માંગો છો? નીચે કોઈ વિષય પસંદ કરો અથવા તમારો પ્રશ્ન લખો.'
  },
  thanks: {
    words: ['thank*', 'thx', 'dhanyavad', 'shukriya', 'aabhar', 'धन्यवाद', 'शुक्रिया', 'આભાર'],
    en: 'You\'re welcome! If you\'d like to see the school, book a campus visit: /index.html#visit',
    hi: 'आपका स्वागत है! स्कूल देखना चाहें तो कैंपस विज़िट बुक करें: /index.html#visit',
    gu: 'આપનો આભાર! શાળા જોવી હોય તો કેમ્પસ મુલાકાત બુક કરો: /index.html#visit'
  },
  // Topic buttons shown first and after an unknown question.
  starters: ['fees', 'age', 'apply', 'visit', 'transport', 'contact']
};
