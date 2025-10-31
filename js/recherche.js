document.addEventListener('DOMContentLoaded', () => {
  const filterContainer = document.getElementById('filter-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  let resultsContainer = null;
  let allData = null; // Stocke data.json
  let skillsData = null; // Stocke skills.json

  // Stockage temporaire des compétences spécifiques sélectionnables au Niveau 3
  let currentSelectableSkills = [];

  // 1. Lire les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchType = urlParams.get('type');
  const searchQuery = urlParams.get('q');

  // ====================================================================
  // FONCTION 1 : Rendu HTML d'une carte (inchangée)
  // ====================================================================
  function renderItemHTML(item) {
    const isExperience = item.type === 'experience';
    const className = isExperience ? 'experience-detail' : 'formation-detail';

    const startDate = new Date(item.start_date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    });
    const endDate = item.end_date
      ? new Date(item.end_date).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
        })
      : 'Présent';
    const period = `${startDate} - ${endDate}`;

    let specificContent = '';
    if (isExperience) {
      specificContent = `<p class="contract">Type de Contrat : <strong>${
        item.contract_type || 'Non Spécifié'
      }</strong></p>`;
      specificContent += `<p class="location">${item.location}</p>`;
    } else {
      specificContent = `<p class="school">${item.school}</p>`;
      specificContent += `<p class="location">${item.location}</p>`;
    }

    return `
            <article class="detail-card ${className}">
                <h2>${item.title}</h2>
                <p class="company">${
                  isExperience ? item.company : item.school
                }</p>
                <p class="period">${period}</p>
                ${specificContent}
                <p class="description">${item.description}</p>
                <div class="skills">
                    <strong>Compétences :</strong> ${item.skills
                      .map((skill) => `<span class="skill-tag">${skill}</span>`)
                      .join('')}
                </div>
            </article>
        `;
  }

  // ====================================================================
  // FONCTION 2 : Affichage final (commune aux deux modes) (inchangée)
  // ====================================================================
  function displayItems(items) {
    if (!resultsContainer) return;

    // Tri par date de fin (du plus récent au plus ancien - OBLIGATOIRE)
    items.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

    if (items.length === 0) {
      resultsContainer.innerHTML =
        '<p class="info-message">Aucun résultat trouvé pour cette recherche.</p>';
      return;
    }

    const resultsHtml = items.map((item) => renderItemHTML(item)).join('');
    resultsContainer.innerHTML = resultsHtml;
  }

  // ====================================================================
  // FONCTION 3 : Recherche Textuelle (inchangée)
  // ====================================================================
  function searchByText(query, data) {
    if (!resultsContainer) return;
    const normalizedQuery = query.toLowerCase().trim();

    const allItems = [...data.experiences, ...data.formations];

    const searchFields = [
      'title',
      'company',
      'school',
      'description',
      'location',
      'contract_type',
    ];

    const results = allItems.filter((item) => {
      for (const field of searchFields) {
        const value = item[field];
        if (value && String(value).toLowerCase().includes(normalizedQuery)) {
          return true;
        }
      }

      if (item.skills && Array.isArray(item.skills)) {
        if (
          item.skills.some((skill) =>
            skill.toLowerCase().includes(normalizedQuery)
          )
        ) {
          return true;
        }
      }

      return false;
    });

    displayItems(results);
  }

  // ====================================================================
  // FONCTION 4 : Filtrage par CHECKBOX (Métier/Diplôme) (inchangée)
  // ====================================================================
  function filterAndDisplayResultsByCheckbox(itemsToFilter, filterKey) {
    if (!resultsContainer) return;

    const checkedBoxes = document.querySelectorAll(
      'input[name="filter"]:checked'
    );
    const selectedTitles = Array.from(checkedBoxes).map((cb) => cb.value);

    if (selectedTitles.length === 0) {
      resultsContainer.innerHTML =
        '<p class="info-message">Veuillez sélectionner au moins un critère pour afficher les résultats.</p>';
      return;
    }

    const filteredItems = itemsToFilter.filter((item) =>
      selectedTitles.includes(item[filterKey])
    );

    displayItems(filteredItems);
  }

  // ====================================================================
  // NOUVELLES FONCTIONS POUR LES COMPÉTENCES (3 NIVEAUX)
  // ====================================================================

  /**
   * NIVEAU 1 : Affiche le choix initial (Hard/Soft Skills).
   */
  function displaySkillCategories() {
    if (!skillsData) return;
    currentSelectableSkills = []; // Réinitialise la liste

    pageTitle.textContent = 'Recherche par Compétences';
    pageSubtitle.textContent = 'Étape 1/3 : Choisissez le type de compétences.';

    const buttonHtml = skillsData.categories
      .map((category) => {
        return `
                <button type="button" class="category-btn" data-slug="${category.slug}">
                    ${category.name} &gt;
                </button>
            `;
      })
      .join('');

    filterContainer.innerHTML = `
            <div id="step-1-category" class="skill-category-choice">
                ${buttonHtml}
            </div>
            <section id="results-container" class="details-container"></section>
        `;

    resultsContainer = document.getElementById('results-container');

    // Ajout des écouteurs d'événements
    document.querySelectorAll('.category-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const slug = e.currentTarget.getAttribute('data-slug');
        const category = skillsData.categories.find((c) => c.slug === slug);
        if (category) displaySkillGroups(category);
      });
    });

    resultsContainer.innerHTML =
      '<p class="info-message">Veuillez choisir une catégorie pour continuer (Étape 1).</p>';
  }

  /**
   * NIVEAU 2 : Affiche les checkboxes des Groupes (regroupement généraliste).
   * @param {Object} category - L'objet de la catégorie sélectionnée (hard-skills ou soft-skills).
   */
  function displaySkillGroups(category) {
    pageSubtitle.textContent = `Étape 2/3 : Affinez par ${category.name}.`;

    const groupHtml = category.groups
      .map((group) => {
        const cleanId = group.slug;
        return `
                <div class="checkbox-item">
                    <input type="checkbox" id="group-${cleanId}" name="group_filter" value="${group.slug}">
                    <label for="group-${cleanId}">${group.name}</label>
                </div>
            `;
      })
      .join('');

    filterContainer.innerHTML = `
            <form id="group-filter-form" class="filter-form">
                <button type="button" id="back-to-category-btn" class="back-btn">← Retour à l'Étape 1</button>
                <div class="checkbox-grid">
                    ${groupHtml}
                </div>
                <button type="submit" class="filter-submit-btn">Passer à l'Étape 3 : Sélection des Compétences</button>
            </form>
            <section id="results-container" class="details-container"></section>
        `;

    resultsContainer = document.getElementById('results-container');

    // Gestion du bouton de retour
    document
      .getElementById('back-to-category-btn')
      .addEventListener('click', displaySkillCategories);

    // Gestion du passage au Niveau 3
    const filterForm = document.getElementById('group-filter-form');
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const checkedBoxes = document.querySelectorAll(
        'input[name="group_filter"]:checked'
      );
      const selectedGroupSlugs = Array.from(checkedBoxes).map((cb) => cb.value);

      if (selectedGroupSlugs.length === 0) {
        alert(
          "Veuillez sélectionner au moins un groupe de compétences pour passer à l'étape suivante."
        );
        return;
      }

      // Collecter toutes les compétences spécifiques (L3) des groupes cochés (L2)
      currentSelectableSkills = [];
      selectedGroupSlugs.forEach((slug) => {
        const group = category.groups.find((g) => g.slug === slug);
        if (group) {
          currentSelectableSkills.push(...group.skills);
        }
      });
      // Assurer l'unicité des compétences
      currentSelectableSkills = [...new Set(currentSelectableSkills)].sort();

      displaySpecificSkills(category);
    });

    resultsContainer.innerHTML =
      '<p class="info-message">Cochez un ou plusieurs groupes pour générer la liste de compétences (Étape 2).</p>';
  }

  /**
   * NIVEAU 3 : Affiche les checkboxes des Compétences spécifiques (pour la sélection finale).
   * @param {Object} category - L'objet de la catégorie principale (hard ou soft).
   */
  function displaySpecificSkills(category) {
    if (currentSelectableSkills.length === 0) return;

    pageSubtitle.textContent = `Étape 3/3 : Choisissez les compétences spécifiques à filtrer.`;

    const skillHtml = currentSelectableSkills
      .map((skill) => {
        const cleanId = skill.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `
                <div class="checkbox-item">
                    <input type="checkbox" id="skill-${cleanId}" name="skill_filter" value="${skill}" checked>
                    <label for="skill-${cleanId}">${skill}</label>
                </div>
            `;
      })
      .join(''); // Les compétences sont cochées par défaut pour faciliter la sélection

    filterContainer.innerHTML = `
            <form id="skill-filter-form" class="filter-form">
                <button type="button" id="back-to-groups-btn" class="back-btn">← Retour à l'Étape 2</button>
                <p class="small-info">Décochez les compétences que vous ne voulez PAS rechercher. (Toutes sont cochées par défaut)</p>
                <div class="checkbox-grid">
                    ${skillHtml}
                </div>
                <button type="submit" class="filter-submit-btn">Afficher les résultats</button>
            </form>
            <section id="results-container" class="details-container"></section>
        `;

    resultsContainer = document.getElementById('results-container');

    // Gestion du bouton de retour au Niveau 2
    document
      .getElementById('back-to-groups-btn')
      .addEventListener('click', () => {
        displaySkillGroups(category); // Revenir aux groupes
      });

    // Gestion du filtrage final
    const filterForm = document.getElementById('skill-filter-form');
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      filterAndDisplayResultsBySkills();
    });

    resultsContainer.innerHTML =
      '<p class="info-message">Cliquez sur "Afficher les résultats" pour lancer la recherche.</p>';
  }

  /**
   * FILTRAGE FINAL : Filtre les éléments en fonction des compétences spécifiques sélectionnées au Niveau 3.
   */
  function filterAndDisplayResultsBySkills() {
    if (!resultsContainer || !allData) return;

    const checkedBoxes = document.querySelectorAll(
      'input[name="skill_filter"]:checked'
    );
    const selectedSkills = Array.from(checkedBoxes).map((cb) => cb.value);

    if (selectedSkills.length === 0) {
      resultsContainer.innerHTML =
        '<p class="info-message">Veuillez sélectionner au moins une compétence pour filtrer.</p>';
      return;
    }

    // 1. Filtrer les expériences et les formations
    const allItems = [...allData.experiences, ...allData.formations];

    const filteredItems = allItems.filter((item) => {
      // Un item est conservé s'il possède au moins UNE des compétences spécifiques cochées
      return item.skills.some((skill) => selectedSkills.includes(skill));
    });

    // 2. Afficher les résultats (tri inclus dans displayItems)
    displayItems(filteredItems);
  }

  // ====================================================================
  // FONCTION 5 : Chargement des données et Initialisation (Point d'entrée)
  // ====================================================================
  async function loadAndInitialize() {
    // Initialisation du conteneur des résultats (HTML)
    filterContainer.innerHTML =
      '<section id="results-container" class="details-container"></section>';
    resultsContainer = document.getElementById('results-container');

    try {
      // Chargement de data.json
      const dataResponse = await fetch('data/data.json');
      if (!dataResponse.ok)
        throw new Error('Erreur lors du chargement des données (data.json).');
      allData = await dataResponse.json();

      if (searchType === 'competence') {
        // Chargement de skills.json UNIQUEMENT pour la recherche par compétence
        const skillsResponse = await fetch('data/skills.json');
        if (!skillsResponse.ok)
          throw new Error(
            'Erreur lors du chargement des données (skills.json).'
          );
        skillsData = await skillsResponse.json();
      }

      // --- LOGIQUE DE DÉTECTION DU MODE DE RECHERCHE ---

      if (searchQuery) {
        // CAS 1 : RECHERCHE TEXTUELLE (?q=...)
        const queryDisplay =
          searchQuery.length > 30
            ? searchQuery.substring(0, 30) + '...'
            : searchQuery;
        pageTitle.textContent = `Résultats pour "${queryDisplay}"`;
        pageSubtitle.textContent = `Recherche globale dans les expériences et formations.`;
        searchByText(searchQuery, allData);
      } else if (searchType) {
        if (searchType === 'metier' || searchType === 'diplome') {
          // CAS 2 : RECHERCHE PAR FILTRES CLASSIQUES (Métier/Diplôme)
          let itemsToFilter =
            searchType === 'metier' ? allData.experiences : allData.formations;
          let titles = itemsToFilter.map((item) => item.title);

          pageTitle.textContent = `Recherche par ${
            searchType === 'metier' ? 'Métiers' : 'Diplômes'
          }`;
          pageSubtitle.textContent = `Cochez un ou plusieurs ${
            searchType === 'metier' ? 'métiers' : 'diplômes'
          } à afficher.`;

          const uniqueTitles = [...new Set(titles)].sort();
          displayCheckboxes(uniqueTitles);

          // Récupération de la référence du conteneur de résultats et écouteur de formulaire
          const filterForm = document.getElementById('filter-form');
          filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            filterAndDisplayResultsByCheckbox(itemsToFilter, 'title');
          });

          resultsContainer.innerHTML =
            '<p class="info-message">Sélectionnez vos filtres et cliquez sur "Afficher les résultats".</p>';
        } else if (searchType === 'competence') {
          // CAS 3 : RECHERCHE PAR COMPÉTENCES (Nouveau mode en trois étapes)
          displaySkillCategories();
        } else {
          // CAS 4 : Type de recherche inconnu
          pageTitle.textContent = 'Recherche Invalide';
          pageSubtitle.textContent = 'Type de recherche non supporté.';
          filterContainer.innerHTML =
            '<p class="error-message">Veuillez utiliser le formulaire de recherche ou le carrousel sur la <a href="index.html">page d\'accueil</a>.</p>';
        }
      } else {
        // CAS 5 : Aucun paramètre
        pageTitle.textContent = 'Recherche Invalide';
        pageSubtitle.textContent =
          "Veuillez revenir à la page d'accueil pour effectuer une recherche valide.";
        filterContainer.innerHTML =
          '<p class="error-message">Veuillez utiliser le formulaire de recherche ou le carrousel sur la <a href="index.html">page d\'accueil</a>.</p>';
      }
    } catch (error) {
      console.error("Erreur fatale lors de l'initialisation:", error);
      filterContainer.innerHTML = `<p class="error-message">Désolé, une erreur critique est survenue lors du chargement des données: ${error.message}</p>`;
    }
  }

  // ====================================================================
  // FONCTION 6 : Affichage de la grille de checkboxes (Métier/Diplôme)
  // ====================================================================
  function displayCheckboxes(items) {
    if (items.length === 0) {
      filterContainer.innerHTML = `<p>Aucun(e) ${searchType} disponible pour le moment.</p>`;
      return;
    }

    const filterHtml = items
      .map((item) => {
        const cleanId = item.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        return `
                    <div class="checkbox-item">
                        <input type="checkbox" id="${searchType}-${cleanId}" name="filter" value="${item}">
                        <label for="${searchType}-${cleanId}">${item}</label>
                    </div>
                `;
      })
      .join('');

    // Ajout du formulaire et des conteneurs
    filterContainer.innerHTML = `
            <form id="filter-form" class="filter-form">
                <div class="checkbox-grid">
                    ${filterHtml}
                </div>
                <button type="submit" class="filter-submit-btn">Afficher les résultats</button>
            </form>
            <section id="results-container" class="details-container"></section>
        `;
  }

  // Lancement de la fonction d'initialisation
  loadAndInitialize();
});
