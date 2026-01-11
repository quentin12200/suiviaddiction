-- Ajouter les 12 livres recommandés avec leurs descriptions complètes
-- Exécuter ce script dans la console Turso : https://turso.tech

-- Option 1: Supprimer tous les livres existants pour repartir à zéro
DELETE FROM Reading;

-- Option 2: Ou ne supprimer que les doublons (si tu as déjà des livres sans description)
-- DELETE FROM Reading WHERE description = '';

-- Insérer les 12 livres avec toutes les descriptions

INSERT INTO Reading (id, title, author, category, description, priority, status, notes) VALUES
('rd001', 'Manuel d''Épictète', 'Épictète', 'stoïcisme', 'Plus court et plus actionnable que Marc Aurèle. Distinction cruciale : ce qui dépend de toi VS ce qui n''en dépend pas. Te recentrer sur ce que tu CONTRÔLES vraiment.', 0, 'non_commencé', ''),

('rd002', 'Lettres à Lucilius', 'Sénèque', 'stoïcisme', 'Conseils concrets sur la vie quotidienne. Lutte contre les passions destructrices. Sénèque parle beaucoup de maîtrise de soi et de tempérance.', 0, 'non_commencé', ''),

('rd003', 'Atomic Habits', 'James Clear', 'psychologie', 'Comment construire de bonnes habitudes et casser les mauvaises. Système des 4 lois du changement de comportement. Exactement ce que tu vis - remplacer addictions par habitudes constructives.', 1, 'non_commencé', ''),

('rd004', 'The Power of Habit', 'Charles Duhigg', 'psychologie', 'La science derrière les habitudes. Boucle : déclencheur → routine → récompense. Comprendre tes patterns (isolement → vide → addictions).', 0, 'non_commencé', ''),

('rd005', 'L''Homme en quête de sens', 'Viktor Frankl', 'psychologie', 'Psychiatre survivant des camps nazis. Logothérapie : trouver du SENS même dans la souffrance. Tu parles de VIDE, d''absence d''objectif - ce livre EST la réponse.', 1, 'non_commencé', ''),

('rd006', 'Can''t Hurt Me', 'David Goggins', 'discipline', 'Ex-obèse devenu Navy SEAL. Dépasser ses limites mentales. Tu cherches l''adrénaline ? Il montre comment la trouver dans le dépassement de soi, pas la transgression.', 1, 'non_commencé', ''),

('rd007', 'Discipline Equals Freedom', 'Jocko Willink', 'discipline', 'Ex-Navy SEAL. La discipline comme chemin vers la liberté. Court, brutal, actionnable - exactement ce dont tu as besoin.', 0, 'non_commencé', ''),

('rd008', 'The War of Art', 'Steven Pressfield', 'discipline', 'Combat contre la procrastination et la résistance interne. Pour les créatifs qui n''arrivent pas à passer à l''action. Transforme l''isolement en création au lieu d''addiction.', 0, 'non_commencé', ''),

('rd009', 'Le Mythe de Sisyphe', 'Albert Camus', 'existentialisme', 'Faut-il vivre dans un monde absurde ? La révolte comme réponse. Tu ressens le vide - Camus l''affronte de face.', 0, 'non_commencé', ''),

('rd010', 'Ainsi parlait Zarathoustra', 'Friedrich Nietzsche', 'existentialisme', 'Création de ses propres valeurs. Amor fati : aimer son destin. Créer ton propre sens au lieu de le chercher ailleurs.', 0, 'non_commencé', ''),

('rd011', 'Wherever You Go, There You Are', 'Jon Kabat-Zinn', 'méditation', 'Méditation de pleine conscience. Être présent au lieu de fuir. Arrêter de fuir dans les addictions, être présent avec le vide.', 0, 'non_commencé', ''),

('rd012', 'The Obstacle Is the Way', 'Ryan Holiday', 'stoïcisme', 'Stoïcisme moderne. Transformer obstacles en opportunités. Tes addictions = obstacles. Ce livre montre comment les utiliser pour grandir.', 0, 'non_commencé', '');

-- Vérifier
SELECT COUNT(*) as total FROM Reading;
SELECT title, author, priority, LEFT(description, 50) as desc_preview FROM Reading ORDER BY priority DESC, category;
