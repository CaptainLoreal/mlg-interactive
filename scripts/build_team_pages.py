#!/usr/bin/env python3
"""
Generate team-<slug>.html pages for the Munich Leadership Group Associate
Partners. Pulls a config from APS (below) and renders each page using a
fixed template that mirrors the layout of the existing team-aguilar.html
etc. — landscape banner hero, Hans-style narrative bio, Areas of Expertise
pills, card quote at the bottom.

Run:
  python3 scripts/build_team_pages.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT  = ROOT
CSS_V = 473   # bump per build so visitors pick up fresh styles.css

# ── Each entry: slug, photo basename, banner basename, name parts,
#    pronoun ("his"/"her"), first name, bio paragraphs, expertise tags,
#    quote text, quote label ("His guiding line" / "Her guiding line").
APS = [
    dict(
      slug="guo", photo="guo.png", banner="guo-banner.jpg",
      name_line1="Mark", name_line2="Guo", first="Mark", pronoun="his",
      bio=[
        "Mark is a senior leadership trainer and executive coach based in Beijing, with deep practice in management development across China and the Asia-Pacific region. He works bilingually in English and Chinese with senior leaders of multinationals and Chinese champions alike.",
        "He holds a <strong>Master&rsquo;s degree in Business Administration</strong> and a Bachelor&rsquo;s degree in Mechanical Engineering, and he has been collaborating with the Munich Leadership Group since 2011. His career bridges training and operations: APAC Leadership Training &amp; Development Consultant at <strong>FedEx Office</strong>, Senior Trainer at Genesis Education Group, and ERP / CRM Consultant at <strong>Lenovo</strong>.",
        "Mark has delivered programs for Mercedes-Benz, IBM, Deloitte, China Telecom, China Mobile, China Vanke, Kimberly-Clark, Baidu, Shell, Lenovo and Beijing International Airport. His focus today is leadership development for middle and senior managers, communication, high-performance teams, meeting management and personal development.",
      ],
      expertise=["Leadership Development","Communication Skills","High Performance Teams","Meeting Management","Presentation Skills","Time Management","Cross-Cultural Training","Executive Coaching"],
      quote='"Attitude is everything. Nothing is impossible. Training creates value."', quote_label="How to become a hero",
    ),
    dict(
      slug="heindl", photo="heindl.png", banner="heindl-banner.jpg",
      name_line1="Hubert", name_line2="Heindl", first="Hubert", pronoun="his",
      bio=[
        "Hubert is a leadership coach, trainer and intercultural consultant whose practice is rooted in adult learning theory and decades of work across continents. He brings an unusual mix of social science depth and on-the-ground field experience to every engagement.",
        "He holds an <strong>M.A. in Education, Sociology and Psychology</strong> from the Universities of Nuremberg and Regensburg, Aberdeen, and the National University of Rwanda. Between 1983 and 1994 he led the Africa Department at Eirene (Neuwied) and served as Consultant and Trainer in socio-economic development programmes &mdash; experience that still shapes how he listens to organizations today.",
        "Since 1994 he has been a trainer and coach for BMW Group, multiple UN agencies, German government ministries, and international corporates &mdash; on team performance, leadership impact, change management, and transcultural competences. He is an Associate Partner of the Munich Leadership Group.",
      ],
      expertise=["Team Performance","Leadership Impact","Change Management","Transcultural Competence","Adult Learning","Coaching","Train the Trainer","Action Research"],
      quote='"Development is created by Man and through Man."', quote_label="How to become a hero",
    ),
    dict(
      slug="hessenauer", photo="hessenauer.jpg", banner="hessenauer-banner.jpg",
      name_line1="Jürgen", name_line2="Hessenauer", first="Jürgen", pronoun="his",
      bio=[
        "Jürgen is a senior leadership trainer and team coach with a background that combines international HR practice with rigorous psychometric methodology. He works at every leadership level, with a particular focus on managing change and developing teams to their highest level.",
        "His professional experience includes the <strong>United Nations Development Programme</strong> (Human Resources Department, Staff Development) and a Munich management consulting firm. He is additionally trained in Transactional Analysis and is a licensed Facilitator for <strong>MBTI Steps I &amp; II</strong>.",
        "Jürgen designs and implements management and leadership programmes, leads change-management initiatives with a strong focus on employee involvement, and coaches senior leaders through transitions. His work spans reengineering, total quality, train-the-trainer architectures, and successful multicultural team-building.",
      ],
      expertise=["Management & Leadership Programs","Change Management","Team Development","Multicultural Teams","Reengineering","Total Quality Management","Train the Trainer","Executive Coaching"],
      quote='"Getting to the top is the easy part &mdash; compared to staying at the top."', quote_label="How to become a hero",
    ),
    dict(
      slug="holch", photo="holch.jpg", banner="holch-banner.jpg",
      name_line1="Gabor", name_line2="Holch", first="Gabor", pronoun="his",
      bio=[
        "Gabor is a corporate trainer, management consultant and executive coach based in Shanghai since 2002. His practice centres on cross-cultural leadership in Asian contexts and on the communication skills senior leaders need to be heard internationally.",
        "He holds a <strong>Master&rsquo;s Degree in International Relations and English Studies</strong> and a Magister of Advanced International Studies from <strong>The Diplomatic Academy of Vienna</strong>. He is a Certified Management Consultant (CMC) and has additional executive-coaching training from the International Coach Academy (ICA).",
        "Earlier in his career he worked in international development with the UN and OSCE. He is a Toastmaster and former President of the Shanghai Leadership Toastmaster Club, and brings that rhetorical discipline to every facilitation and coaching engagement.",
      ],
      expertise=["Leadership Development","Cross-Cultural Leadership","Asia-Pacific Leadership","Executive Communication","Presentation Skills","Public Speaking","Executive Coaching"],
      quote='"Lead so that you can be understood &mdash; especially across cultures."', quote_label="How to become a hero",
    ),
    dict(
      slug="hyatt", photo="hyatt.jpg", banner="hyatt-banner.jpg",
      name_line1="David E.", name_line2="Hyatt, PhD", first="David", pronoun="his",
      bio=[
        "David is a senior leadership consultant and executive coach with a deep grounding in industrial-organizational psychology. He has led international consulting organizations and designs leadership-development architectures for global clients across hospitality, retail and gaming.",
        "He holds a <strong>B.A. in Psychology</strong> from Allegheny College, an <strong>M.A. in Psychology</strong> from the College of William and Mary, and a <strong>Ph.D. in Industrial &amp; Organizational Psychology</strong> from Bowling Green State University. He has served as a faculty member in an applied Master&rsquo;s programme teaching leadership, organizational development, selection and applied research methods.",
        "David is a certified executive coach from the <strong>Center for Creative Leadership</strong> and a practitioner of multiple 360, individual and team assessment tools. His work spans hiring-system design, leadership programmes, and consultant development &mdash; with delivery across the United States and Brazil.",
      ],
      expertise=["Leadership Development","Executive Coaching","Industrial-Organizational Psychology","360 Assessments","Team Assessments","Employee Surveys","Hiring Systems","Performance Management"],
      quote='"Alignment is built one honest conversation at a time."', quote_label="How to become a hero",
    ),
    dict(
      slug="jones", photo="jones.jpg", banner="jones-banner.jpg",
      name_line1="Glyn", name_line2="Jones", first="Glyn", pronoun="his",
      bio=[
        "Glyn is an executive coach and leadership consultant who has been running his own consultancy since 2002 and collaborating with the Munich Leadership Group since 2007. His focus: helping leaders prosper at the transitions where the role changes faster than they do.",
        "He holds a <strong>Master&rsquo;s degree in Management Learning</strong> from the Management School, Lancaster University, and is a Qualified Executive Coach with a post-graduate certificate in coaching. He is an NLP practitioner and an authorised user of Hogan, NeuroColor, MBTI&reg;, StrengthsFinder&reg;, Strengthscope and Margerison-McCann Linking Skills Profile.",
        "Earlier in his career he led training and development in automotive, distribution and higher-education organisations, and served as Senior Consultant focused on change management in manufacturing. Today he coaches senior leaders, designs integrated leadership programmes, facilitates board-level strategy work, and runs team development &mdash; including using the outdoors for impact.",
      ],
      expertise=["Executive Coaching","Senior Team Strategy","Leadership Development","Team Development","360 Feedback","Board Facilitation","Change Management","Psychometric Assessment"],
      quote='"View leadership from the position of those being led."', quote_label="How to become a hero",
    ),
    dict(
      slug="klawitter", photo="klawitter.png", banner="klawitter-banner.jpg",
      name_line1="Kate", name_line2="Klawitter", first="Kate", pronoun="her",
      bio=[
        "Kate is a performance-driven senior consultant and executive coach with 20+ years of practice across the public and private sectors. She combines strategic clarity with deep change-management craft.",
        "She holds a <strong>Bachelor of Arts (Hons)</strong> from Melbourne University, Executive Leadership from <strong>Cornell University</strong>, and further executive development from Harvard and Oxford. Her private-sector career covered <strong>Accenture</strong> and <strong>Ernst &amp; Young</strong> as a Change Management specialist, with industry depth in financial services, telecoms, government and resources.",
        "Kate has also worked deeply in the public sector in the UK &mdash; including as a Strategy Adviser to Prime Minister Tony Blair within the Prime Minister&rsquo;s Delivery Unit. Today she focuses on culture change, executive coaching, training design, strategy development and programme management.",
      ],
      expertise=["Change Management","Organisational Culture Change","Executive Leadership Coaching","Training Design","Process Optimization","Strategy Development","Program Management"],
      quote='"Creativity is thinking up new things. Innovation is doing new things." &mdash; Theodore Levitt', quote_label="How to become a hero",
    ),
    dict(
      slug="kraen", photo="kraen.png", banner="kraen-banner.jpg",
      name_line1="Thomas", name_line2="Krän", first="Thomas", pronoun="his",
      bio=[
        "Thomas is an independent management consultant, intercultural trainer and team coach with an unusually international footprint &mdash; consulting and teaching across Europe and Asia in three languages.",
        "He holds an <strong>INSEAD MBA</strong> from Fontainebleau, studied at the <strong>Stockholm School of Economics</strong> with a major in Marketing, and completed Georgetown Summer School in Washington, D.C. His operating career was in sales, product and marketing management at <strong>Playtex</strong> (Scandinavia, France, Europe) and <strong>Levi Strauss &amp; Co.</strong> (France, Europe).",
        "Since 2000 he has run his own consultancy. He is a Certified Global&rsquo;Ease Trilingual Trainer in Working in an Intercultural Environment and teaches Managing Cultural Differences and Global Presentation Skills at the University of Paris since 2008 &mdash; with guest professorships at HEC Paris, Centrale Paris, Stavanger University and University of Technology Sydney.",
      ],
      expertise=["Managing Cultural Differences","Global Presentation Skills","Team Building","Train the Trainer","Leadership & Management Training","Business Development","Workshop Facilitation"],
      quote='"No question is stupid. Ask questions. Ask more questions &mdash; and respect the culture of your counterpart."', quote_label="How to become a hero",
    ),
    dict(
      slug="koehler", photo="koehler.jpg", banner="koehler-banner.jpg",
      name_line1="Doreen", name_line2="Köhler", first="Doreen", pronoun="her",
      bio=[
        "Doreen is a senior executive coach, trainer and lecturer with deep expertise in leadership development, change, and the embodied / non-verbal side of executive communication.",
        "She holds a <strong>University Diploma in International Economics</strong> from Universität Passau, with extended periods in Spain, Italy, Latin America and Senegal. She lectures in Leadership, Change Management and Coaching at <strong>Leuphana Universität Lüneburg</strong>, and is a licensed DISG&reg; facilitator, a Certified Senior Coach and certified Coach Trainer (DCV).",
        "Her additional training spans transactional analysis, systemic organizational development, mimic resonance and embodiment-focused psychology. Doreen designs and delivers integrated executive programmes, coaches one-on-one and in teams, and runs Train-the-Coach seminars across German-speaking Europe.",
      ],
      expertise=["Leadership Training","Intercultural Teams","Self-Management","Executive Coaching","Team Coaching","Train the Coach","Mimic Resonance & Body Language","Conflict Management","Mediation"],
      quote='"Problem talk creates problems. Solution talk creates solutions." &mdash; Steve de Shazer', quote_label="How to become a hero",
    ),
    dict(
      slug="lale", photo="lale.png", banner="lale-banner.jpg",
      name_line1="Serdar", name_line2="Lale", first="Serdar", pronoun="his",
      bio=[
        "Serdar is an executive coach, leadership trainer and culture-change consultant who pairs an operator&rsquo;s background with rigorous coach training. He works with senior leaders and intact teams on the inner work that makes outer change possible.",
        "He holds a <strong>Degree in Management</strong> from Middle East Technical University in Ankara. His operating experience includes sales and trade marketing at <strong>Henkel Turkey</strong> and the role of General Manager at <strong>Carl K&uuml;hne Turkey</strong>. He has been a trainer and coach since 2004.",
        "Serdar is an ICF Professional Certified Coach, with CTI Co-Active Coaching and Leadership training and ORSC (Organization and Relationship Systems Coaching) certification. His focus: leadership development, talent development, executive and team coaching, corporate culture and change, top management strategy workshops, and employee engagement.",
      ],
      expertise=["Leadership Development","Talent Development","Executive Coaching","Team Coaching","Corporate Culture & Change","Top Management Strategy","Employee Engagement"],
      quote='"Doing inner work to know thyself is the number-one responsibility of human beings."', quote_label="How to become a hero",
    ),
    dict(
      slug="lo", photo="lo.png", banner="lo-banner.jpg",
      name_line1="Patti", name_line2="Lo", first="Patti", pronoun="her",
      bio=[
        "Patti is a senior HR leader and executive coach with two decades of experience building leadership pipelines, assessment systems and culture change in global organizations across China and Asia. She is tri-lingual in English, Mandarin and Cantonese.",
        "She holds a <strong>Bachelor of Business majoring in Human Resources</strong> from the Royal Melbourne Institute of Technology and has been collaborating with the Munich Leadership Group since 2011. Her operating career includes Head of HR at <strong>Unilever</strong> and <strong>British American Tobacco</strong> in China, HR Director at <strong>METRO Cash &amp; Carry China</strong>, and VP HR for the Asia Region.",
        "Patti led the establishment of METRO&rsquo;s Training Center in China and the METRO-Harvard Leadership Program for Asian managers. She now focuses on one-to-one executive coaching, performance and potential assessment, talent development, change management, and assessment- and development-center design.",
      ],
      expertise=["Executive Coaching","Performance Management","Talent Development","Senior Recruitment","Internal Communication & Change","Assessment Centers","Development Centers","Multicultural Team Effectiveness"],
      quote='"Yesterday is for appreciation. Today is for real. Tomorrow is for imagination. Live life to the fullest."', quote_label="How to become a hero",
    ),
    dict(
      slug="lucke", photo="lucke.jpg", banner="lucke-banner.jpg",
      name_line1="Lynn", name_line2="Lucke", first="Lynn", pronoun="her",
      bio=[
        "Lynn is a strategic leadership coach and organizational consultant working with leaders from front-line supervisors to CEOs across U.S. industries and government agencies.",
        "She holds a <strong>B.A. in Psychology</strong> (with a minor in Accounting) from the University of Colorado, Colorado Springs, and an <strong>M.A. in Organizational Leadership</strong> from the University of the Rockies. She is the owner of <strong>L &amp; L Consulting, LLC</strong> and a certified executive coach with the Center for Creative Leadership.",
        "Lynn serves as an Assessor with the U.S. Office of Personnel Management (OPM) and a moderator for the Apollo Professional Development Group. She delivers leadership programs, provides 360 and personality-based assessment feedback, and coaches across industries &mdash; with prior careers at Cameron/Butcher Commercial Real Estate and as a stockbroker with Merrill Lynch.",
      ],
      expertise=["Leadership Development","Executive Coaching","Government Assessment","Benchmark 360 Feedback","Personality Assessment","Conflict Resolution","Change Style Feedback"],
      quote='"If your actions inspire others to dream more, learn more, do more, and become more, you are a leader." &mdash; John Quincy Adams', quote_label="How to become a hero",
    ),
    dict(
      slug="marsh", photo="marsh.jpg", banner="marsh-banner.jpg",
      name_line1="Elena", name_line2="Marsh", first="Elena", pronoun="her",
      bio=[
        "Elena is an executive coach, leadership trainer and HR practitioner whose work is anchored in self-awareness, personal mastery, and the disciplined facilitation of high-stakes business conversations.",
        "She holds a <strong>Master&rsquo;s degree in Marketing (with Honours)</strong> from the International Academy for Marketing and Management in Moscow, ICF-accredited Personal Performance and Corporate Executive Coaching Diplomas from <strong>TCA London</strong>, and a CIPD Level 3 Foundation Certificate in HR Practice. She has 15 years of international HR and People Development experience.",
        "Elena designs and delivers training programmes on personal leadership, performance and talent management, presentation skills, resilience and stress management, and coaching for people managers. She is the founder and president of a non-profit organisation for personal development.",
      ],
      expertise=["Personal Leadership","Performance & Talent Management","Effective Presentations","Resilience & Stress Management","Coaching for Managers","Performance Coaching","Conflict-Resolution Coaching"],
      quote='"Success starts from self-awareness and personal mastery."', quote_label="How to become a hero",
    ),
    dict(
      slug="mauve", photo="mauve.jpg", banner="mauve-banner.jpg",
      name_line1="Ulrike", name_line2="Mauve", first="Ulrike", pronoun="her",
      bio=[
        "Ulrike is a senior change-management consultant, leadership coach and former executive search professional whose practice centres on cultural transformation, leadership development, and the post-merger work that turns mergers into actual integrations.",
        "She holds a <strong>Diploma in Economics</strong> and brings management experience across General Management, Marketing, Sales, Business Development and HR. She spent 14 years in executive search recruiting up to C-level &mdash; an unusual asset for understanding the leadership-talent landscape from the inside.",
        "Ulrike designs comprehensive change-management plans, facilitates the development of cultures that embrace change, and trains leaders to drive transformation effectively &mdash; with a particular focus on continuous improvement and sustainable adoption of new ways of working.",
      ],
      expertise=["Change Management","Cultural Transformation","Leadership Development","Post-Merger Integration","Reorganization","Executive Coaching","Organizational Development"],
      quote='"Embrace change, even when it&rsquo;s uncomfortable. The fun lies in discovering what comes next."', quote_label="How to become a hero",
    ),
    dict(
      slug="michaely", photo="michaely.jpg", banner="michaely-banner.jpg",
      name_line1="Tonia Maria", name_line2="Michaely", first="Tonia", pronoun="her",
      bio=[
        "Tonia is a design researcher, transformation agent and storyteller whose practice connects human-centred design with leadership development. She helps leaders use empathy and behavioural insight as tools, not slogans.",
        "She holds a <strong>B.A. in Communication in Business and Social Contexts</strong> from the University of Arts, Berlin and an <strong>M.Sc. in Consumer Affairs</strong> with a specialization in Innovation, Technology &amp; Leadership from TU Munich. She was a research fellow at the LMU Center for Cognitive Neuroscience and a PhD fellow at the TUM Chair of Consumer Research, and is a Certified Design Thinking Coach (Hasso Plattner Institute, University of Potsdam).",
        "Her career spans Experiential Marketing at <strong>BMW AG</strong> (2013&ndash;2015) and Manager at <strong>Deloitte Digital GmbH</strong> (2015&ndash;2019). She joined the Munich Leadership Group in 2019 and is also certified in Scrum and agile methods (borisgloger).",
      ],
      expertise=["Design Thinking","Human-Centred Innovation","Cognitive Neuroscience","Storytelling","Workshop Facilitation","Agile & Scrum","Cultural Transformation"],
      quote='"When I talk to managers, I feel they are important. When I talk to leaders, I feel that I am important."', quote_label="How to become a hero",
    ),
    dict(
      slug="millar", photo="millar.png", banner="millar-banner.jpg",
      name_line1="Jane", name_line2="Millar", first="Jane", pronoun="her",
      bio=[
        "Jane is an international executive coach who works trilingually with senior leaders and their teams. Her work pairs ten years of practice with leading European business schools and a deep psychometric craft.",
        "She is an associate trainer for the occupational psychologists <strong>OPP</strong>, with particular expertise in psychometric profiling across a wide range of instruments. She holds MBTI certification training credentials on behalf of OPP in the UK and Italy (Step 1 and 2).",
        "Jane consults on organizational-design interventions, coaches leaders up to CEO level, facilitates multicultural team development (often using MBTI and Lencioni models), and runs group sessions on leadership development programmes.",
      ],
      expertise=["Executive Coaching","Leadership Development","Multicultural Team Development","MBTI Certification","Lencioni Team Dysfunctions","Psychometric Profiling","Organizational Design"],
      quote='"Know yourself. Seek to understand and appreciate others. Keep asking questions."', quote_label="How to become a hero",
    ),
    dict(
      slug="naeslund", photo="naeslund.png", banner="naeslund-banner.jpg",
      name_line1="Vivianne", name_line2="Näslund", first="Vivianne", pronoun="her",
      bio=[
        "Vivianne is a senior consultant and executive coach focused on leadership development and change management in global organisations. She has worked on assignments in more than 20 countries and lived in five &mdash; her native Sweden, France, Switzerland, Germany and the UK.",
        "She holds business and language studies (Sweden) and an <strong>MBA</strong> from the UK and Germany. She has worked with executives from more than 55 nations across six continents and major industry sectors &mdash; automotive, aerospace, banking, consumer products, financial services and beyond. She has been with the Munich Leadership Group since 2007.",
        "Vivianne is a senior-level advisor to private equity groups and companies on leadership issues in cross-border M&amp;A. She is a certified practitioner in multiple 360 surveys and individual / team assessment tools including MBTI, FIRO-B and CPI, and is fluent in Swedish, English and French with strong German.",
      ],
      expertise=["Executive Coaching","Cross-Cultural Leadership","Cross-Border M&A Advisory","Leadership Development","Multicultural Team Development","Change Programmes","360 Feedback","Team Assessment"],
      quote='"The ability to inspire and emotionally connect with people is the key skill of any leader &mdash; even more so in a global setting."', quote_label="How to become a hero",
    ),
    dict(
      slug="orbea", photo="orbea.png", banner="orbea-banner.jpg",
      name_line1="Angelita", name_line2="Orbea", first="Angelita", pronoun="her",
      bio=[
        "Angelita is a senior consultant and executive coach with over ten years of practice across industries, focused on supporting leaders to develop the self-awareness that turns good intentions into better outcomes for their organizations.",
        "She holds a <strong>Master and Bachelor degree in Business Administration</strong> and a <strong>Master&rsquo;s degree in Consulting</strong> from Ashridge Business School and Middlesex University. She is qualified in the <strong>British Psychological Society</strong> Levels A &amp; B.",
        "Angelita is an experienced facilitator of large group events, board meetings, and team development sessions. Her focus areas are leadership development, high-performance teamwork, culture change, and coaching skills.",
      ],
      expertise=["Leadership Development","High Performance Teamwork","Culture Change","Coaching Skills","Board Facilitation","Large-Group Facilitation","BPS Psychometrics"],
      quote='"Support leaders to develop a deeper awareness of their own patterns &mdash; in the service of better outcomes for their people."', quote_label="How to become a hero",
    ),
    dict(
      slug="ramos", photo="ramos.png", banner="ramos-banner.jpg",
      name_line1="Teresa", name_line2="Ramos", first="Teresa", pronoun="her",
      bio=[
        "Teresa is an executive coach, leadership consultant and intercultural facilitator with over 25 years of international experience at executive level. A Spanish national who has lived in Spain, the UK and Germany, she works fluently in German, Spanish and English.",
        "Her academic record is remarkably broad: a <strong>Graduate in Music</strong> from Salamanca Conservatorium, a <strong>Graduate in Theoretical Physics</strong> from Salamanca University, a <strong>Master in Telecommunications</strong> from King&rsquo;s College London, and an <strong>Executive MBA</strong> from Instituto de Empresa in Madrid. She is a Certified Business Coach (WABC), an affiliate member of the Institute of Coaching at <strong>Harvard Medical School</strong>, and an Accredited Business Coach at Meyler Campbell.",
        "Teresa supports the management and delivery of complex international-intercultural projects &mdash; counselling project leaders, aligning teams, and coaching individuals. Her focus is leadership development, high-performance teams, intercultural management, change and innovation, and group and executive coaching.",
      ],
      expertise=["Leadership Development","High Performance Teams","Intercultural Management","Workshop Facilitation","Change Management","Innovation Coaching","Executive Coaching","Group & Team Coaching"],
      quote='"At the centre of your being you have the answer; you know who you are and you know what you want." &mdash; Lao Tzu', quote_label="How to become a hero",
    ),
    dict(
      slug="rentel", photo="rentel.png", banner="rentel-banner.jpg",
      name_line1="Susanne", name_line2="Rentel", first="Susanne", pronoun="her",
      bio=[
        "Susanne is a leadership developer, systemic consultant and team coach with a rare double-foundation: a legal training and a deep grounding in social-pedagogic and systemic practice.",
        "She studied <strong>Law at the University of Augsburg</strong> and <strong>Social Education at the University of Applied Sciences in Munich</strong>. Her professional experience spans a legal working environment and two consultancies, with leadership experience as a line supervisor. She is a Systemic Consultant trained at the Wiesloch Institute for Systemic Consulting.",
        "Susanne is an Associate Partner of the Munich Leadership Group, with additional training in Transactional Analysis. She focuses on leadership programmes, change-management consulting, conflict moderation between employer and employee, workshop and large-group facilitation, team development, and Train-the-Trainer approaches.",
      ],
      expertise=["Leadership Development","Change Management","Conflict Moderation","Workshop Facilitation","Team Development","Train the Trainer","Systemic Consulting"],
      quote='"If you want to build a ship, do not drum guys to supply wood &mdash; teach them the desire for the far, endless sea." &mdash; Antoine de Saint-Exup&eacute;ry', quote_label="How to become a hero",
    ),
    dict(
      slug="saliba", photo="saliba.jpg", banner="saliba-banner.jpg",
      name_line1="Basel", name_line2="Saliba", first="Basel", pronoun="his",
      bio=[
        "Basel is a senior leadership consultant, executive coach and excellence assessor whose practice runs from leadership effectiveness and transformational change to organizational health and emotional intelligence.",
        "He has provided consulting services to leading groups, including the <strong>World Bank</strong>, EU agencies, governments, businesses, educational and not-for-profit organizations. He has assessed and led top organizations through Excellence Awards.",
        "He holds a <strong>Master&rsquo;s Degree in Psychology</strong> and a Bachelor&rsquo;s degree in Computer Engineering, with certifications as a Leadership Trainer, Management Developer, Leadership Facilitator, <strong>EFQM Excellence Assessor</strong>, Project Management Professional (PMP), and Trainer of Trainers.",
      ],
      expertise=["Leadership Effectiveness","Transformational Leadership","Organizational Strategy","Organizational Development","Cultural Health","Emotional Intelligence","Executive Coaching & Mentoring"],
      quote='"Raise leaders who make a difference. See the whole picture &mdash; but be led by your dreams, not your fears."', quote_label="How to become a hero",
    ),
    dict(
      slug="sanchez", photo="sanchez.png", banner="sanchez-banner.jpg",
      name_line1="Margaret A.", name_line2="Sánchez", first="Margaret", pronoun="her",
      bio=[
        "Margaret is an executive consultant, facilitator and leadership coach with practice that spans for-profit, non-profit and government leadership development. She is based in Rochester, NY and has been collaborating with the Munich Leadership Group since 2011.",
        "She holds a <strong>B.A. in Spanish</strong> and an <strong>M.A. in Guidance &amp; Counseling</strong> from Michigan State University, and is a Certified <strong>MBTI</strong> Instructor.",
        "Margaret&rsquo;s focus is change management, strategic planning, diversity initiatives, executive consultations, leadership and human-resource development, needs assessment, benchmarking, facilitation, and team building &mdash; with extensive teaching experience in communication skills at the university and community level.",
      ],
      expertise=["Change Management","Strategic Planning","Diversity Initiatives","Executive Consultation","Leadership Development","Human Resource Development","Needs Assessment","Benchmarking","Team Effectiveness"],
      quote='"Individuals lead most effectively when they discover, understand, and apply their unique talents."', quote_label="How to become a hero",
    ),
    dict(
      slug="seidenfus", photo="seidenfus.png", banner="seidenfus-banner.jpg",
      name_line1="Christoph", name_line2="Seidenfus", first="Christoph", pronoun="his",
      bio=[
        "Christoph is a senior leadership trainer, executive coach and process facilitator whose practice has been built on Transactional Analysis, NLP, and EFQM excellence assessment. He has been an Associate Partner of the Munich Leadership Group since 1994.",
        "He holds a <strong>University Diploma in Law, Political Sciences, Business and Organizational Psychology</strong>. He is a Teaching and Supervising Transactional Analyst, an NLP Master Trainer, and an <strong>EFQM Business Excellence assessor</strong>.",
        "Christoph focuses on leadership topics including communication, conflict management, target setting, and change &amp; restructuring processes. His engagements include the development of high-performance teams, executive coaching, senior-team strategy work, and process moderation in workshops.",
      ],
      expertise=["Leadership Training","High Performance Teams","Executive Coaching","Strategy Workshops","Process Moderation","Conflict Management","Change & Restructuring","Transactional Analysis","NLP"],
      quote='"Responsibility, passion for performance, personal growth."', quote_label="How to become a hero",
    ),
    dict(
      slug="sellani", photo="sellani.jpg", banner="sellani-banner.jpg",
      name_line1="Francesca", name_line2="Sellani", first="Francesca", pronoun="her",
      bio=[
        "Francesca is an executive consultant, assessor, trainer and coach with 15 years of leadership experience in the Oil &amp; Gas sector and as the founder of a consultancy. She works across all leadership levels in multiple organizations.",
        "She holds <strong>Master&rsquo;s degrees in Knowledge Management and Social Sciences</strong> from Universit&agrave; degli Studi di Roma Tre and La Sapienza. Her qualifications cover training methodology, HR management &amp; strategy, workshop facilitation, group and team coaching, and transactional analysis.",
        "She is an ICF-certified Coach (ACC), an ATC Organisational Counsellor, and a Gallup StrengthsFinder Coach &amp; Team Coach. Her focus: leadership development, employee experience and employer branding design, executive coaching and assessment, personal branding and career coaching, and the facilitation of cultural change.",
      ],
      expertise=["Leadership Development","Executive Coaching & Assessment","Employee Experience","Employer Branding","Cultural Change","Group & Team Coaching","Career Coaching"],
      quote='"It will go as you want it to go."', quote_label="How to become a hero",
    ),
    dict(
      slug="shields", photo="shields.jpg", banner="shields-banner.jpg",
      name_line1="Jim", name_line2="Shields", first="Jim", pronoun="his",
      bio=[
        "Jim is a senior executive coach and team-development specialist who has worked deeply with C-suite leaders across pharmaceutical, healthcare, agriculture, energy, software and military organizations.",
        "He holds a <strong>BA in Political Science</strong> from Guilford College and a <strong>Masters of Divinity</strong> from McCormick Theological Seminary. He brings certifications in 360 and personality assessments, advanced facilitation, and executive coaching.",
        "Jim was Global Portfolio Lead for the <strong>Center for Creative Leadership&rsquo;s Leadership at the Peak</strong> programme for C-suite executives, where he led the programme redesign and the qualification of trainers. He is the founder and head of <strong>LeaderCore</strong>, developing coaching, senior-team development and training for global clients.",
      ],
      expertise=["Executive Coaching","Teams in Transition","Senior Executive Development","Leadership Assessments","Organizational Climate","Advanced Facilitation"],
      quote='"&lsquo;Developing&rsquo; is really about changing &mdash; how you behave, how you think, and how you see."', quote_label="How to become a hero",
    ),
    dict(
      slug="tallman", photo="tallman.jpg", banner="tallman-banner.jpg",
      name_line1="Rich", name_line2="Tallman", first="Rich", pronoun="his",
      bio=[
        "Rich is a senior executive coach and global facilitator with the <strong>Center for Creative Leadership&rsquo;s C-suite offering, Leadership at the Peak</strong>. He has partnered with companies across the for-profit, government, and non-governmental worlds.",
        "He has served as Global Portfolio Director and is certified in a variety of 360 feedback and personality assessments and simulation exercises. He is also a certified coach with the Center for Creative Leadership, focusing on senior and high-potential leaders, and is current faculty with CCL, Mountain States Employers Council, and Apollo Group.",
        "Rich&rsquo;s practice centres on facilitating conversations that advance better leadership at every level of an organization, and helping organizations understand the role of culture in how change does &mdash; or doesn&rsquo;t &mdash; happen.",
      ],
      expertise=["Executive Coaching","Senior Leadership Development","Culture & Change","Conversation Facilitation","360 Feedback","Personality Assessments","High-Potential Coaching"],
      quote='"Starve your distractions and feed your focus."', quote_label="How to become a hero",
    ),
    dict(
      slug="vanetti", photo="vanetti.jpg", banner="vanetti-banner.jpg",
      name_line1="Eric", name_line2="Vanetti, PhD", first="Eric", pronoun="his",
      bio=[
        "Eric is a senior leadership consultant and executive coach with deep expertise in change management, organizational performance, and talent management.",
        "He focuses on the core levers that move organizational performance &mdash; competency management, employee engagement, process improvement and team effectiveness &mdash; with a particular interest in how leaders&rsquo; values and attitudes shape what is possible.",
        "Eric&rsquo;s practice combines individual coaching with organization-wide diagnostic and intervention work to align leadership behaviours with strategic intent.",
      ],
      expertise=["Change Management","Competency Management","Employee Engagement","Organizational Performance","Process Improvement","Talent Management","Team Effectiveness"],
      quote='"What separates truly great leaders from average ones is their core values, beliefs and attitudes toward people."', quote_label="How to become a hero",
    ),
    dict(
      slug="west", photo="west.jpg", banner="west-banner.jpg",
      name_line1="Jan", name_line2="West", first="Jan", pronoun="her",
      bio=[
        "Jan is a licensed psychologist and executive coach with practice across law, healthcare, architecture, advertising, energy, government, military, education and start-up environments. She is a Center for Creative Leadership executive coach and an ICF Certified Coach.",
        "She holds a <strong>Ph.D. in Community / Clinical Psychology</strong> from the University of Nebraska with a minor in Program Evaluation, and a <strong>B.A. in Psychology (Highest Distinction)</strong> from the same university. Her clinical credentials include an APA-Approved Internship and Research Fellowship at the Seattle Veterans Administration.",
        "Jan focuses on senior leadership team alignment and strengthening, coaching company founders and executives in startups and established companies, strategy coaching for grant pitch competitions, and leadership development across every level from first-time managers to C-Suite. She serves on the Beanstalk Foundation board and the Women&rsquo;s Council of the Leeds School of Business at the University of Colorado, Boulder.",
      ],
      expertise=["Senior Team Alignment","Founder & CEO Coaching","Leadership Development","Change Management","Conflict Resolution","Communication Skills","360 & Style Assessments"],
      quote='"Everyone shines, given the right lighting." &mdash; Susan Cain', quote_label="How to become a hero",
    ),
    dict(
      slug="xue", photo="xue.png", banner="xue-banner.jpg",
      name_line1="Christine", name_line2="Xue", first="Christine", pronoun="her",
      bio=[
        "Christine is a senior leadership trainer, executive coach and intercultural facilitator based in Shanghai, with two decades of practice in China and across Europe. She has been collaborating with the Munich Leadership Group since 2008.",
        "She holds a <strong>Degree in Psychology</strong> from Shanghai Teacher&rsquo;s University (focus on educational psychology) and a <strong>Bachelor in International Business Management</strong> from the same institution. She is a licensed DISC&reg; Facilitator and the sole distributor of the DISC&reg; Personality Factor Profile in Greater China since 2005.",
        "Christine has been a business partner of CE.TOP Training &amp; Consulting since 2004 and is fluent in English and Chinese. Her focus: leadership skills and coaching for senior managers, conflict management, intercultural training, DISC&reg;-based personality and career coaching, meeting effectiveness, and time and self-management.",
      ],
      expertise=["Leadership Skills","Coaching for Senior Managers","Conflict Management","Intercultural Training","DISC Personality Profiling","Career Coaching","Meeting Effectiveness","Time & Self Management"],
      quote='"Do unto others as they want to be done unto."', quote_label="How to become a hero",
    ),
    dict(
      slug="yong", photo="yong.png", banner="yong-banner.jpg",
      name_line1="Stephen", name_line2="Yong", first="Stephen", pronoun="his",
      bio=[
        "Stephen is a senior leadership facilitator and executive coach based in Asia, with a focus on leadership transitions and change. He has been collaborating with the Munich Leadership Group since 2011.",
        "He holds a <strong>Master&rsquo;s in Human Resource Development</strong> from George Washington University and a <strong>Master&rsquo;s in Engineering</strong> from McGill University. His professional experience includes managing global and regional projects at ABN AMRO, JPMorgan, Hewlett-Packard and Andersen Consulting.",
        "Stephen is accredited in MBTI Step I &amp; II, FIRO-B, Team Management Profiles, DiSC, Benchmarks, Skillscope and Inventory of Learning Styles, and has delivered programmes for Fortune 500 companies in Asia including JPMorgan, UBS, BP, Johnson &amp; Johnson, BASF, Credit Suisse, Amgen and Linde Gas.",
      ],
      expertise=["Leadership in Transition","Team Leader & Manager Training","Coaching Skills","Performance Management","Feedback & Objectives","Diversity Workshops","Executive Coaching","Influence Without Authority"],
      quote='"Help managers in transition become leaders &mdash; one impactful conversation at a time."', quote_label="How to become a hero",
    ),
    dict(
      slug="yilancioglu", photo="yilancioglu.png", banner="yilancioglu-banner.jpg",
      name_line1="Biran", name_line2="Yılancıoğlu", first="Biran", pronoun="her",
      bio=[
        "Biran is a passionate HR consultant, trainer, facilitator and professional coach (CPCC, ACC) with deep practice in leadership and adult-learning programmes across international corporations.",
        "She holds a <strong>Diploma in Labour Economics and Industrial Relations</strong> from Istanbul University and a <strong>Master&rsquo;s Degree in Human Resources Management</strong> from Marmara University, with a thesis on the factors that determine whether adult learning transfers to the workplace.",
        "Her professional roles include Facilitator, Academy Leader, European Head of Onboarding Programmes, Head of Leadership Trainings and Head of Learning &amp; Development in international corporations. She brings vast experience in managing multicultural teams and complex projects.",
      ],
      expertise=["Leadership Skills","Leadership Coaching & Mentoring","Communication Skills","Personal & Corporate Values","Management Trainee Programs","Assessment & Development Centers","HR Training Systems","Corporate Academy"],
      quote='"If you change, your effect changes &mdash; once your effect changes, the world changes."', quote_label="How to become a hero",
    ),
]

# ── Template (matches the structure of team-aguilar.html and friends) ──
TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#000" />
  <meta http-equiv="Cache-Control" content="no-cache, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <title>{full_name} — Munich Leadership Group</title>
  <link rel="icon" href="assets/mark.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="styles.css?v={css_v}" />
  <style>
    body {{ overflow: visible; }}
    .standalone {{ overflow: visible; min-height: 100dvh; }}
    .profile-hero {{ position: relative; height: 58vh; min-height: 360px; overflow: hidden; }}
    .profile-hero__media {{ position: absolute; inset: 0; }}
    .profile-hero__media img {{ width: 100%; height: 100%; object-fit: cover; object-position: center center; }}
    .profile-hero__scrim {{ position: absolute; inset: 0; background: linear-gradient(to top, #000 0%, rgba(14,15,16,0.55) 45%, rgba(14,15,16,0.05) 100%); }}
    .profile-hero__copy {{ position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: clamp(24px,5vw,72px) clamp(24px,5vw,72px) clamp(32px,6vh,64px); }}
    .profile-hero__name {{ font-size: clamp(30px,4.5vw,58px); font-weight: 600; letter-spacing: -0.02em; color: #fff; margin: 0 0 10px; line-height: 1.1; }}
    .profile-hero__role {{ font-size: 13px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.50); margin: 0; }}
    .profile-content {{ background: #000; padding: clamp(48px,7vh,96px) clamp(24px,5vw,72px) 0; }}
    .profile-body {{ max-width: 820px; margin: 0 auto clamp(48px,7vh,80px); }}
    .profile-body p {{ font-size: 15px; line-height: 1.75; color: rgba(255,255,255,0.65); margin: 0 0 18px; }}
    .profile-body p strong {{ color: rgba(255,255,255,0.88); }}
    .profile-section-label {{ font-size: 12px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mlg-red); margin: 32px 0 14px; }}
    .profile-tags {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 8px; }}
    .profile-tag {{ font-size: 12px; font-weight: 500; letter-spacing: 0.05em; color: rgba(255,255,255,0.60); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 5px 14px; }}
    .profile-quote {{ max-width: 820px; margin: 0 auto clamp(40px,6vh,72px); padding: 32px 40px; background: rgba(181,0,52,0.10); border: 1px solid rgba(181,0,52,0.28); border-radius: 8px; }}
    .profile-quote__label {{ font-size: 13px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mlg-red); margin: 0 0 14px; }}
    .profile-quote__text {{ font-size: clamp(15px,1.8vw,18px); line-height: 1.7; color: rgba(255,255,255,0.80); margin: 0; font-style: italic; }}
    .profile-cta {{ text-align: center; padding: clamp(32px,5vh,56px) 0; border-top: 1px solid rgba(255,255,255,0.08); max-width: 1200px; margin: 0 auto; }}
    .profile-cta p {{ color: rgba(255,255,255,0.55); font-size: 14px; margin: 0 0 20px; }}
    .profile-cta__btn {{ display: inline-flex; align-items: center; gap: 8px; background: var(--mlg-red); color: #fff; font-family: var(--font-sans); font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; padding: 13px 28px; border-radius: 999px; transition: opacity 200ms; border: none; cursor: pointer; }}
    .profile-cta__btn:hover {{ opacity: 0.85; }}
    @media (max-width: 640px) {{ .profile-quote {{ padding: 24px; }} }}
  </style>
</head>
<body>
  <main class="standalone">
    <div class="topbar">
      <a class="topbar__logo" href="index.html#slide=0" aria-label="Munich Leadership Group — back to home">
        <img decoding="async" loading="lazy" src="assets/logo-white-bold.svg" alt="Munich Leadership Group" />
      </a>
    </div>
    <span class="corner-mark" aria-hidden="true">
      <svg class="mark__path mark__path--1" viewBox="236 0 67 65"><path d="M302.059,64.913L293.891,8.134L236.69,0.066L302.059,0.066L302.059,64.913Z" fill="currentColor"/></svg>
      <svg class="mark__path mark__path--2" viewBox="236 0 67 65"><path d="M287.625,64.906L281.26,20.665L236.69,14.375L287.625,14.375L287.625,64.906Z" fill="currentColor"/></svg>
      <svg class="mark__path mark__path--3" viewBox="236 0 67 65"><path d="M274.971,64.942L270.186,31.681L236.685,26.958L274.971,26.958L274.971,64.942Z" fill="#b50034"/></svg>
    </span>

    <div class="profile-hero">
      <div class="profile-hero__media">
        <img decoding="async" loading="lazy" src="assets/team/associates/banners/{banner}" alt="{full_name}" />
      </div>
      <div class="profile-hero__scrim"></div>
      <div class="profile-hero__copy">
        <a class="page-back" href="index.html#slide=8">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span>back to team</span>
        </a>
        <p class="profile-hero__eyebrow">Associate Partner</p>
        <h1 class="profile-hero__name">{name_line1}<br>{name_line2}</h1>
        <p class="profile-hero__role">Munich Leadership Group</p>
      </div>
    </div>

    <div class="profile-content">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html#slide=8">Team</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <span class="breadcrumb__current">{full_name}</span>
      </nav>

      <div class="profile-body">

        <p class="profile-section-label">Personal profile</p>

{bio_html}

        <p class="profile-section-label">Areas of Expertise</p>
        <div class="profile-tags">
{tags_html}
        </div>
      </div>

      <div class="profile-quote">
        <p class="profile-quote__label">{quote_label}</p>
        <p class="profile-quote__text">{quote}</p>
      </div>

      <div class="profile-cta">
        <p>Want to work with {first}?</p>
        <a class="profile-cta__btn" href="index.html#slide=10">
          Get in touch with us
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <div style="margin-top: 14px;">
          <button class="profile-cta__btn" type="button" onclick="window.print()">
            Generate PDF
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
          </button>
        </div>
        <div style="margin-top: 20px;">
          <a class="page-back" href="index.html#slide=8">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>back to the team</span>
          </a>
        </div>
      </div>

      <footer class="imprint" style="margin-top: clamp(32px,4vh,56px);">
        <p class="imprint__links">
          <a href="disclaimer.html">Disclaimer</a>
          <span aria-hidden="true">&middot;</span>
          <span class="imprint__copy">&copy; 2026 Munich Leadership Group</span>
        </p>
      </footer>

    </div>
  </main>

  <script>
    document.querySelectorAll('.page-back').forEach((a) => {{
      a.addEventListener('click', (e) => {{
        const href = a.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        document.querySelector('.standalone').classList.add('is-leaving');
        setTimeout(() => {{ location.href = href; }}, 320);
      }});
    }});
  </script>
  <script src="subnav.js"></script>
</body>
</html>
"""

def render(p):
    full_name = f"{p['name_line1']} {p['name_line2']}"
    bio_html = "\n\n".join(f"        <p>{para}</p>" for para in p["bio"])
    tags_html = "\n".join(f"          <span class=\"profile-tag\">{t}</span>" for t in p["expertise"])
    html = TEMPLATE.format(
        full_name=full_name,
        css_v=CSS_V,
        banner=p["banner"],
        name_line1=p["name_line1"],
        name_line2=p["name_line2"],
        first=p["first"],
        bio_html=bio_html,
        tags_html=tags_html,
        quote_label=p["quote_label"],
        quote=p["quote"],
    )
    out = OUT / f"team-{p['slug']}.html"
    out.write_text(html, encoding="utf-8")
    return out

def main():
    for p in APS:
        out = render(p)
        print(f"✓ {out.name}")
    print(f"\nTotal: {len(APS)} pages")

if __name__ == "__main__":
    main()
