/*
  # Ajout de Partenaires pour Nouvelles Catégories

  1. Nouveaux Partenaires
    - Crédit Oriental Banque (banque)
    - Atlas Finance (banque)
    - Orient Events Corp (entreprise)
    - Tech Solutions Orient (entreprise)
    - Association Culturelle Orientale (association)
    - Solidarité Orient (association)

  2. Notes
    - Enrichissement du catalogue avec de nouvelles catégories
    - Diversification des partenaires disponibles
*/

-- Insert partners for new categories
INSERT INTO partners (name, slug, category, short_description, full_description, seo_title, seo_description, seo_keywords, main_image, services, display_order, is_active)
VALUES 
(
  'Crédit Oriental Banque',
  'credit-oriental-banque',
  'banque',
  'Solutions de financement dédiées aux événements et célébrations. Prêts personnels avantageux et accompagnement personnalisé.',
  'Crédit Oriental Banque est votre partenaire financier de confiance pour concrétiser vos projets d''événements. Nous comprenons l''importance des grandes célébrations et proposons des solutions de financement adaptées à vos besoins spécifiques.

Nos conseillers spécialisés vous accompagnent dans l''élaboration de votre projet et vous proposent des solutions de financement sur mesure : prêts personnels à taux préférentiels pour mariages et événements, facilités de paiement, plans de financement flexibles adaptés à votre budget.

Processus rapide et simplifié : réponse en 48h, déblocage rapide des fonds, accompagnement personnalisé tout au long du projet. Service client dédié disponible 6j/7. Plus de 15 ans d''expérience dans le financement d''événements orientaux.',
  'Crédit Oriental Banque - Financement Événements | Mariages & Célébrations',
  'Banque spécialisée financement événements orientaux. Prêts mariages avantageux. Solutions personnalisées. Réponse rapide 48h. Accompagnement dédié.',
  'crédit mariage, financement mariage, prêt personnel, banque événement, financement oriental',
  'https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg',
  ARRAY['Prêts événements taux préférentiels', 'Réponse rapide 48h', 'Plans financement flexibles', 'Déblocage rapide fonds', 'Conseiller dédié projet', 'Simulation gratuite en ligne'],
  10,
  true
),
(
  'Atlas Finance',
  'atlas-finance',
  'banque',
  'Cabinet de conseil financier spécialisé en gestion de patrimoine et investissements pour la communauté orientale.',
  'Atlas Finance est un cabinet de conseil financier expert qui accompagne les particuliers et entrepreneurs de la communauté orientale dans la gestion et l''optimisation de leur patrimoine. Notre expertise combine savoir-faire financier international et compréhension profonde des besoins spécifiques de notre clientèle.

Nos services incluent : conseil en investissement, optimisation fiscale, transmission de patrimoine, gestion de portefeuille, solutions d''épargne retraite, assurance-vie, investissements immobiliers. Chaque stratégie est conçue sur mesure pour répondre à vos objectifs personnels et familiaux.

Équipe de conseillers certifiés avec plus de 20 ans d''expérience. Approche holistique prenant en compte votre situation globale. Confidentialité absolue garantie. Rendez-vous au cabinet ou à votre domicile selon votre convenance.',
  'Atlas Finance - Conseil Patrimoine & Investissement | Gestion Privée',
  'Cabinet conseil financier communauté orientale. Gestion patrimoine, investissements, optimisation fiscale. Conseillers certifiés expérimentés. Approche personnalisée.',
  'conseil financier, gestion patrimoine, investissement, conseiller financier, finance orient',
  'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg',
  ARRAY['Gestion patrimoine sur mesure', 'Conseil investissement expert', 'Optimisation fiscale légale', 'Transmission patrimoine familial', 'Rendez-vous flexibles', 'Confidentialité garantie'],
  11,
  true
),
(
  'Orient Events Corporation',
  'orient-events-corporation',
  'entreprise',
  'Leader de l''organisation d''événements corporates orientaux. Séminaires, galas d''entreprise et célébrations professionnelles.',
  'Orient Events Corporation est le spécialiste reconnu de l''événementiel d''entreprise à thématique orientale. Nous créons des expériences corporate uniques qui allient professionnalisme moderne et raffinement oriental pour renforcer votre image de marque et fédérer vos équipes.

Nos prestations comprennent : organisation de séminaires résidentiels, galas d''entreprise prestigieux, lancements de produits, soirées de networking, team-building orientaux, conventions internationales, dîners VIP clients. Chaque événement est conçu pour marquer les esprits et atteindre vos objectifs business.

Équipe projet dédiée, gestion complète de A à Z : recherche de lieux d''exception, scénographie et décoration sur mesure, animation culturelle orientale, traiteur gastronomique, logistique et coordination le jour J. Plus de 200 événements corporate réalisés avec succès.',
  'Orient Events Corporation - Événementiel Entreprise | Galas & Séminaires',
  'Organisation événements corporate orientaux. Séminaires, galas entreprise, team building. Solutions clés en main. Plus de 200 événements réalisés.',
  'événement entreprise, séminaire oriental, gala corporate, team building, événementiel professionnel',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
  ARRAY['Séminaires résidentiels luxe', 'Galas entreprise prestigieux', 'Team building orientaux', 'Scénographie sur mesure', 'Gestion complète A-Z', 'Coordination jour J'],
  12,
  true
),
(
  'Tech Solutions Orient',
  'tech-solutions-orient',
  'entreprise',
  'Solutions technologiques innovantes pour événements. Streaming live, applications événementielles et expériences digitales immersives.',
  'Tech Solutions Orient révolutionne l''expérience événementielle en intégrant les technologies les plus innovantes. Notre expertise technique permet de créer des événements hybrides et digitaux qui repoussent les limites de la créativité tout en respectant l''esthétique et les codes orientaux.

Nos solutions technologiques : streaming vidéo multi-caméras HD/4K, applications événementielles personnalisées, murs LED géants et mapping vidéo architectural, bornes photos intelligentes avec IA, diffusion simultanée sur réseaux sociaux, captation par drones professionnels, réalité virtuelle et augmentée.

Équipe de techniciens certifiés disponibles 24/7. Matériel professionnel dernière génération. Installation et démontage rapides. Assistance technique durant tout l''événement. Nous transformons votre événement en une expérience technologique mémorable.',
  'Tech Solutions Orient - Technologies Événements | Streaming & Digital',
  'Solutions tech événements orientaux. Streaming HD, mapping vidéo, applications événementielles. Murs LED, drones, réalité virtuelle. Équipe technique 24/7.',
  'technologie événement, streaming événement, mapping vidéo, application événementielle, tech orient',
  'https://images.pexels.com/photos/2102416/pexels-photo-2102416.jpeg',
  ARRAY['Streaming multi-caméras 4K', 'Applications événementielles', 'Murs LED et mapping vidéo', 'Captation drone professionnelle', 'Réalité virtuelle/augmentée', 'Équipe technique 24/7'],
  13,
  true
),
(
  'Association Culturelle Orientale',
  'association-culturelle-orientale',
  'association',
  'Association à but non lucratif promouvant la culture et les arts orientaux. Ateliers, expositions et événements culturels gratuits.',
  'L''Association Culturelle Orientale œuvre depuis plus de 25 ans pour la promotion, la préservation et la transmission du riche patrimoine culturel oriental. Nous organisons tout au long de l''année des événements gratuits et accessibles à tous pour faire découvrir les multiples facettes de la culture orientale.

Nos activités comprennent : ateliers de calligraphie arabe, cours de musique traditionnelle (oud, qanun, darbouka), stages de danse orientale, expositions d''artistes orientaux contemporains, conférences sur l''histoire et la civilisation orientale, festivals culturels annuels, projections de films du patrimoine.

Adhésion annuelle symbolique donnant accès à tous les ateliers et événements. Encadrement par des professionnels passionnés. Lieu convivial favorisant les échanges interculturels. Soutien aux artistes émergents de la communauté.',
  'Association Culturelle Orientale - Promotion Culture & Arts Orientaux',
  'Association culturelle orientale Paris. Ateliers gratuits calligraphie, musique, danse. Expositions, conférences, festivals. 25 ans d''expérience culturelle.',
  'association culturelle orientale, culture orientale, arts orientaux, ateliers orientaux, festival oriental',
  'https://images.pexels.com/photos/8636625/pexels-photo-8636625.jpeg',
  ARRAY['Ateliers culturels gratuits', 'Cours musique traditionnelle', 'Stages danse orientale', 'Expositions artistes orientaux', 'Conférences patrimoine', 'Festivals culturels annuels'],
  14,
  true
),
(
  'Solidarité Orient',
  'solidarite-orient',
  'association',
  'Association humanitaire d''aide aux familles en difficulté. Actions solidaires, collectes et accompagnement social personnalisé.',
  'Solidarité Orient est une association humanitaire reconnue d''utilité publique qui vient en aide aux familles de la communauté orientale en situation de précarité. Notre mission est d''apporter un soutien concret et digne aux personnes traversant des difficultés temporaires ou durables.

Nos actions solidaires : aide alimentaire avec distribution de colis mensuels, soutien financier ponctuel pour situations d''urgence, accompagnement administratif et social, aide à la scolarité des enfants, organisation de repas communautaires durant Ramadan, collectes de vêtements et mobilier, médiation familiale et écoute psychologique.

Équipe de bénévoles engagés et de travailleurs sociaux professionnels. Confidentialité et respect de la dignité garantis. Partenariats avec institutions locales et nationales. Transparence totale sur l''utilisation des dons. Possibilité de bénévolat et de mécénat d''entreprise.',
  'Solidarité Orient - Association Humanitaire | Aide Familles en Difficulté',
  'Association humanitaire aide communauté orientale. Aide alimentaire, soutien financier, accompagnement social. Actions solidaires toute l''année. Bénévoles engagés.',
  'association humanitaire, aide familiale, solidarité orientale, action sociale, bénévolat',
  'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
  ARRAY['Aide alimentaire mensuelle', 'Soutien financier urgence', 'Accompagnement social', 'Aide scolarité enfants', 'Repas communautaires Ramadan', 'Médiation et écoute'],
  15,
  true
);
