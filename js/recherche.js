document.addEventListener('DOMContentLoaded', () => {
  const filterContainer = document.getElementById('filter-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  let resultsContainer = null;
  let allData = null; // Stocke les données JSON une fois chargées

  // 1. Lire les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchType = urlParams.get('type');
  const searchQuery = urlParams.get('q'); // Récupère la requête textuelle

  /**
   * Génère la chaîne HTML pour afficher une carte (Expérience ou Formation).
   * @param {Object} item - L'objet expérience ou formation issu du JSON.
   * @returns {string} Le code HTML de la carte.
   */
  function renderItemHTML(item) {
    // La propriété 'type' dans data.json détermine s'il s'agit d'une expérience
    const isExperience = item.type === 'experience';
    const className = isExperience ? 'experience-detail' : 'formation-detail';

    // Formatage des dates en français
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

  /**
   * Filtre les éléments en fonction des checkboxes cochées et les affiche.
   */
  function filterAndDisplayResultsByCheckbox() {
    if (!resultsContainer || !allData || !searchType) return;

    // 1. Récupérer les valeurs cochées
    const checkedBoxes = document.querySelectorAll(
      'input[name="filter"]:checked'
    );
    const selectedTitles = Array.from(checkedBoxes).map((cb) => cb.value);

    if (selectedTitles.length === 0) {
      resultsContainer.innerHTML =
        '<p class="info-message">Veuillez sélectionner au moins un critère pour afficher les résultats.</p>';
      return;
    }

    let itemsToFilter = [];
    let filterKey = 'title';

    if (searchType === 'metier') {
      itemsToFilter = allData.experiences;
    } else if (searchType === 'diplome') {
      itemsToFilter = allData.formations;
    } else {
      resultsContainer.innerHTML =
        '<p class="error-message">Erreur : type de recherche inconnu.</p>';
      return;
    }

    // 2. Filtrer les éléments
    const filteredItems = itemsToFilter.filter((item) =>
      selectedTitles.includes(item[filterKey])
    );

    // 3. Trier et Afficher
    displayItems(filteredItems);
  }

  /**
   * Effectue une recherche textuelle sur l'ensemble des expériences et formations.
   * @param {string} query - Le mot-clé de recherche.
   * @param {Object} data - Les données complètes (expériences et formations).
   */
  function searchByText(query, data) {
    if (!resultsContainer) return;
    const normalizedQuery = query.toLowerCase().trim();

    // Combine toutes les données en un seul tableau
    const allItems = [...data.experiences, ...data.formations];

    // Définir les champs dans lesquels effectuer la recherche
    const searchFields = [
      'title',
      'company',
      'school',
      'description',
      'location',
      'contract_type',
    ];

    const results = allItems.filter((item) => {
      // Vérifier les champs standards
      for (const field of searchFields) {
        const value = item[field];
        if (value && String(value).toLowerCase().includes(normalizedQuery)) {
          return true;
        }
      }

      // Vérifier le tableau des compétences (skills)
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

    // Trier et Afficher
    displayItems(results);
  }

  /**
   * Trie les résultats par date et les affiche dans le DOM.
   * @param {Array} items - La liste finale d'objets (expériences/formations).
   */
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

  async function loadAndInitialize() {
    // Initialisation du conteneur des résultats (HTML)
    filterContainer.innerHTML =
      '<section id="results-container" class="details-container"></section>';
    resultsContainer = document.getElementById('results-container');

    try {
      const response = await fetch('data/data.json');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données.');
      }
      allData = await response.json();

      // --- LOGIQUE DE DÉTECTION DU MODE DE RECHERCHE ---

      if (searchQuery) {
        // CAS 1 : RECHERCHE TEXTUELLE (?q=...)
        const queryDisplay =
          searchQuery.length > 30
            ? searchQuery.substring(0, 30) + '...'
            : searchQuery;
        pageTitle.textContent = `Résultats pour "${queryDisplay}"`;
        pageSubtitle.textContent = `Recherche globale dans les expériences et formations.`;

        // Exécuter la recherche et l'affichage
        searchByText(searchQuery, allData);

        // On n'affiche pas les filtres par checkbox dans ce mode
      } else if (
        searchType &&
        (searchType === 'metier' || searchType === 'diplome')
      ) {
        // CAS 2 : RECHERCHE PAR FILTRES (?type=metier ou ?type=diplome)

        let titles = [];
        if (searchType === 'metier') {
          titles = allData.experiences.map((exp) => exp.title);
          pageTitle.textContent = 'Recherche par Métiers';
          pageSubtitle.textContent =
            'Cochez un ou plusieurs métiers pour voir les expériences correspondantes.';
        } else if (searchType === 'diplome') {
          titles = allData.formations.map((form) => form.title);
          pageTitle.textContent = 'Recherche par Diplômes';
          pageSubtitle.textContent =
            'Cochez un ou plusieurs diplômes pour voir les formations correspondantes.';
        }

        // Génération et Affichage des Checkboxes
        const uniqueTitles = [...new Set(titles)].sort();
        displayCheckboxes(uniqueTitles);

        // Message initial
        resultsContainer.innerHTML =
          '<p class="info-message">Sélectionnez vos filtres et cliquez sur "Afficher les résultats".</p>';
      } else {
        // CAS 3 : Aucun paramètre ou paramètre invalide
        pageTitle.textContent = 'Recherche Invalide';
        pageSubtitle.textContent =
          "Veuillez revenir à la page d'accueil pour effectuer une recherche valide.";
        filterContainer.innerHTML =
          '<p class="error-message">Veuillez utiliser le formulaire de recherche ou le carrousel sur la <a href="index.html">page d\'accueil</a>.</p>';
      }
    } catch (error) {
      console.error("Erreur fatale lors de l'initialisation:", error);
      filterContainer.innerHTML =
        '<p>Désolé, une erreur critique est survenue lors du chargement des données.</p>';
    }
  }

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

    // Récupération de la référence du conteneur de résultats
    resultsContainer = document.getElementById('results-container');

    // Ajout du gestionnaire d'événement
    const filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      filterAndDisplayResultsByCheckbox(); // Appel de la fonction de filtrage par checkbox
    });
  }

  // Lancement de la fonction d'initialisation
  loadAndInitialize();
});
