document.addEventListener('DOMContentLoaded', () => {
  const filterContainer = document.getElementById('filter-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  // Conteneur où les résultats filtrés seront affichés, initialisé à null
  let resultsContainer = null;
  let allData = null; // Stocke les données JSON une fois chargées

  // 1. Lire le paramètre 'type' de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchType = urlParams.get('type');

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
  function filterAndDisplayResults() {
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
    let filterKey = 'title'; // La clé de filtrage est toujours 'title' pour 'metier' et 'diplome'

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

    // 3. Trier les éléments (du plus récent au plus ancien)
    filteredItems.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

    // 4. Afficher les résultats
    if (filteredItems.length === 0) {
      resultsContainer.innerHTML =
        '<p class="info-message">Aucun résultat trouvé pour les critères sélectionnés.</p>';
      return;
    }

    // Génération du HTML et injection dans le DOM
    const resultsHtml = filteredItems
      .map((item) => renderItemHTML(item))
      .join('');
    resultsContainer.innerHTML = resultsHtml;
  }

  async function fetchUniqueTitles() {
    if (!searchType || (searchType !== 'metier' && searchType !== 'diplome')) {
      filterContainer.innerHTML =
        '<p class="error-message">Type de recherche non spécifié ou non valide.</p>';
      return;
    }

    try {
      const response = await fetch('data/data.json');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données.');
      }
      // Stockage des données complètes dans la variable globale allData
      allData = await response.json();

      let titles = [];

      // Détermination des titres et mise à jour du header
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

      // Filtrer pour n'avoir que les titres uniques et trier par ordre alphabétique
      const uniqueTitles = [...new Set(titles)].sort();

      // Afficher les filtres
      displayCheckboxes(uniqueTitles);
    } catch (error) {
      console.error('Erreur de chargement des données de recherche:', error);
      filterContainer.innerHTML =
        '<p>Désolé, impossible de charger les options de filtre.</p>';
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

    // Récupération de la référence du conteneur de résultats et ajout de l'écouteur
    resultsContainer = document.getElementById('results-container');
    const filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      filterAndDisplayResults();
    });

    // Affichage initial du message d'instruction
    resultsContainer.innerHTML =
      '<p class="info-message">Sélectionnez vos filtres et cliquez sur "Afficher les résultats".</p>';
  }

  // Lancer la fonction d'initialisation
  fetchUniqueTitles();
});
