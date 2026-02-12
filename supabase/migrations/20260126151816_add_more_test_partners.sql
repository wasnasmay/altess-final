/*
  # Ajout de Partenaires de Test Supplémentaires

  1. Nouveaux Partenaires
    - Voyage de Rêve Orient (agence de voyages)
    - Splendide Jardin des Délices (salle de réception)
    - Harmonie Orientale DJ (animation musicale)
    - Fleurs d'Orient (décoration florale)
    - Prestige Car Orient (location véhicules)
    - Jasmin Beauté (maquillage et coiffure)

  2. Notes
    - Ajout de partenaires dans différentes catégories pour enrichir le catalogue
    - Photos professionnelles via Pexels
    - Descriptions détaillées et réalistes
*/

-- Insert additional partners for testing
INSERT INTO partners (name, slug, category, short_description, full_description, seo_title, seo_description, seo_keywords, main_image, services, display_order, is_active)
VALUES 
(
  'Voyage de Rêve Orient',
  'voyage-reve-orient',
  'voyage',
  'Agence de voyages spécialisée dans les destinations orientales. Circuits personnalisés et séjours de rêve au Maghreb et Moyen-Orient.',
  'Voyage de Rêve Orient est votre partenaire privilégié pour découvrir les merveilles du monde oriental. Depuis plus de 15 ans, nous organisons des voyages exceptionnels vers les plus belles destinations du Maghreb, du Moyen-Orient et au-delà.

Notre équipe de spécialistes conçoit des circuits sur mesure adaptés à vos envies : voyages de noces romantiques, circuits culturels, séjours balnéaires, escapades dans le désert, découvertes gastronomiques. Chaque voyage est une expérience unique et mémorable.

Nous prenons en charge tous les aspects de votre voyage : billets d''avion, hébergement dans les meilleurs établissements, transferts privés, guides francophones expérimentés, excursions et activités. Service client disponible 24/7 pendant votre séjour.',
  'Voyage de Rêve Orient - Agence Voyages Destinations Orientales | Circuits Personnalisés',
  'Agence de voyages spécialisée Maghreb et Moyen-Orient. Circuits sur mesure, voyages de noces, séjours culturels. Plus de 15 ans d''expérience.',
  'agence voyage orient, circuit maghreb, voyage maroc, séjour tunisie, voyage de noces oriental',
  'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg',
  ARRAY['Circuits personnalisés sur mesure', 'Voyages de noces romantiques', 'Hébergement hôtels 4-5 étoiles', 'Guides francophones experts', 'Transferts privés confort', 'Assistance 24/7 pendant séjour'],
  4,
  true
),
(
  'Splendide Jardin des Délices',
  'splendide-jardin-delices',
  'salle',
  'Domaine privatif avec jardin méditerranéen et salle panoramique. Cadre enchanteur pour mariages et réceptions en plein air.',
  'Le Splendide Jardin des Délices vous accueille dans un cadre naturel exceptionnel de 3 hectares. Notre domaine privatif allie élégance architecturale et beauté des jardins méditerranéens pour créer un lieu unique où célébrer vos plus beaux moments.

La salle de réception panoramique de 400m² s''ouvre sur les jardins et offre une vue imprenable. Les espaces extérieurs aménagés permettent d''organiser des cocktails et cérémonies en plein air. Fontaines, allées fleuries, pergolas et éclairages féériques créent une atmosphère magique.

Capacité d''accueil jusqu''à 400 personnes. Équipements professionnels complets : cuisine équipée, sonorisation, climatisation, parking 120 places. Notre équipe d''organisation vous accompagne pour faire de votre événement une réussite parfaite.',
  'Splendide Jardin des Délices - Domaine Réception | Mariages & Événements',
  'Domaine privatif 3 hectares avec salle panoramique et jardins. Mariages, réceptions plein air. Capacité 400 personnes. Cadre enchanteur naturel.',
  'domaine mariage, salle réception jardin, mariage plein air, lieu réception nature, domaine privatif',
  'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg',
  ARRAY['Domaine privatif 3 hectares', 'Salle panoramique 400m²', 'Jardins méditerranéens aménagés', 'Espaces cocktail extérieurs', 'Parking privé 120 places', 'Équipe organisation dédiée'],
  5,
  true
),
(
  'Harmonie Orientale DJ',
  'harmonie-orientale-dj',
  'animation',
  'DJ professionnel spécialisé musique orientale et internationale. Animation musicale complète pour soirées inoubliables.',
  'Harmonie Orientale DJ apporte l''ambiance parfaite à vos événements avec une expertise musicale unique. Notre équipe de DJ professionnels maîtrise parfaitement la musique orientale traditionnelle et moderne, ainsi que les hits internationaux pour satisfaire tous les goûts.

Avec plus de 10 ans d''expérience dans l''animation d''événements prestigieux, nous savons créer l''ambiance idéale à chaque moment de votre soirée. Du cocktail d''accueil au dancefloor enflammé, notre playlist est adaptée en temps réel selon l''énergie de votre public.

Équipement professionnel haute qualité : système son puissant, jeux de lumières LED intelligents, effets spéciaux (fumée, confettis), écrans LED pour visuels. Backup complet de matériel pour garantir une soirée sans interruption.',
  'Harmonie Orientale DJ - Animation Musicale Événements | Mariages & Soirées',
  'DJ professionnel spécialisé musique orientale et internationale. Animation complète mariages et événements. Équipement sono-lumière professionnel.',
  'dj oriental, animation musicale mariage, dj mariage oriental, soirée orientale, animation événement',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  ARRAY['Musique orientale et internationale', 'Équipement sono professionnel', 'Éclairages LED intelligents', 'Effets spéciaux et animations', 'Playlist personnalisée', 'Expérience 10 ans événementiel'],
  6,
  true
),
(
  'Fleurs d''Orient',
  'fleurs-orient',
  'decoration',
  'Création florale sur mesure pour événements. Compositions raffinées alliant fleurs exotiques et design oriental contemporain.',
  'Fleurs d''Orient transforme vos événements en jardins enchantés grâce à des créations florales exceptionnelles. Notre atelier d''art floral combine expertise botanique et sensibilité artistique pour concevoir des compositions uniques qui subliment vos espaces.

Spécialisés dans les événements orientaux, nous créons des arrangements qui respectent les codes esthétiques tout en apportant une touche moderne et raffinée. Roses, orchidées, pivoines, jasmin... chaque fleur est sélectionnée pour sa qualité et son harmonie dans l''ensemble.

Services complets : consultation créative, conception sur mesure, livraison et installation. Bouquets de mariée, centres de table, arches florales monumentales, décorations murales végétales, compositions suspendues. Chaque création est une œuvre d''art éphémère.',
  'Fleurs d''Orient - Créations Florales Événements | Mariages & Réceptions',
  'Atelier création florale événementiel. Compositions sur mesure orientales modernes. Bouquets mariée, centres table, arches florales. Fleurs exotiques premium.',
  'fleuriste mariage oriental, décoration florale, bouquet mariée oriental, centre table fleurs, arche florale',
  'https://images.pexels.com/photos/1024975/pexels-photo-1024975.jpeg',
  ARRAY['Créations florales sur mesure', 'Fleurs exotiques premium', 'Bouquets de mariée uniques', 'Arches florales monumentales', 'Centres de table raffinés', 'Installation complète le jour J'],
  7,
  true
),
(
  'Prestige Car Orient',
  'prestige-car-orient',
  'transport',
  'Location de véhicules de prestige pour mariages et événements. Flotte luxueuse avec chauffeurs professionnels en tenue.',
  'Prestige Car Orient met à votre disposition une flotte exceptionnelle de véhicules de luxe pour faire de votre événement un moment d''élégance et de raffinement. Chaque voiture de notre collection est entretenue avec le plus grand soin pour garantir confort et perfection.

Notre gamme comprend des limousines spacieuses, berlines de luxe, SUV prestigieux et véhicules d''exception. Tous nos véhicules sont décorés selon vos souhaits : rubans, fleurs, décorations personnalisées. L''intérieur peut être aménagé avec champagne, pétales de roses et musique d''ambiance.

Chauffeurs professionnels en tenue élégante, formés au service haut de gamme. Ponctualité irréprochable, discrétion et courtoisie. Service complet avec coordination des horaires, itinéraires optimisés et disponibilité toute la journée si nécessaire.',
  'Prestige Car Orient - Location Véhicules Luxe | Mariages & Événements',
  'Location voitures de prestige pour mariages et événements. Limousines, berlines luxe. Chauffeurs professionnels. Décoration personnalisée.',
  'location voiture mariage, limousine mariage, voiture prestige, location véhicule luxe, transport mariage',
  'https://images.pexels.com/photos/3849196/pexels-photo-3849196.jpeg',
  ARRAY['Flotte véhicules de prestige', 'Limousines spacieuses luxe', 'Décoration personnalisée', 'Chauffeurs en tenue élégante', 'Service haut de gamme', 'Disponibilité journée complète'],
  8,
  true
),
(
  'Jasmin Beauté',
  'jasmin-beaute',
  'beaute',
  'Institut spécialisé maquillage et coiffure orientale. Équipe d''artistes pour sublimer les mariées et invités le jour J.',
  'Jasmin Beauté est l''institut de référence pour la beauté orientale et le maquillage de mariée. Notre équipe d''artistes passionnées possède une expertise unique dans l''art de sublimer la beauté naturelle tout en respectant les traditions et les codes esthétiques orientaux.

Spécialisées dans le maquillage oriental sophistiqué, nos maquilleuses maîtrisent les techniques du regard intense, du contouring parfait et de la tenue longue durée. Pour la coiffure, nous créons des chignons majestueux, des coiffures ornées et des poses de voile impeccables.

Service complet le jour J : essais préalables illimités jusqu''à satisfaction totale, déplacement à domicile ou sur lieu de réception, retouches durant l''événement, équipe disponible pour maquiller famille et invités. Produits cosmétiques professionnels haut de gamme.',
  'Jasmin Beauté - Maquillage & Coiffure Mariée Orientale | Institut Beauté',
  'Institut spécialisé maquillage coiffure orientale. Équipe professionnelle mariages. Maquillage sophistiqué, chignons majestueux. Déplacement à domicile.',
  'maquillage mariage oriental, coiffure mariée orientale, maquilleuse professionnelle, institut beauté orientale, maquillage henné',
  'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg',
  ARRAY['Maquillage oriental sophistiqué', 'Coiffures mariée majestueuses', 'Essais illimités inclus', 'Déplacement à domicile', 'Retouches durant événement', 'Cosmétiques pro haut de gamme'],
  9,
  true
);
