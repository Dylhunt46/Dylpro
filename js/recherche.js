document.addEventListener('DOMContentLoaded', () => {
  const filterContainer = document.getElementById('filter-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  // 1. Lire le paramètre 'type' de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchType = urlParams.get('type');

  // 2. Récupérer et traiter les données
  async function fetchUniqueTitles(type) {
    try {
      const response = await fetch('data/data.json');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données.');
      }
      const data = await response.json();

      let titles = [];

      // Logique de filtrage en fonction du type
      if (type === 'metier') {
        // On prend les titres des expériences
        titles = data.experiences.map((exp) => exp.title);
        pageTitle.textContent = 'Sélectionner un métier';
        pageSubtitle.textContent = 'Cochez les métiers à afficher.';
      } else if (type === 'diplome') {
        // On prend les titres des formations/diplômes
        titles = data.formations.map((form) => form.title);
        pageTitle.textContent = 'Sélectionner un diplôme';
        pageSubtitle.textContent = 'Cochez les diplômes à afficher.';
      } else {
        // Gérer les autres types (Projet, Secteur), ou par défaut
        pageTitle.textContent = `Recherche par ${type || 'Critère Inconnu'}`;
        pageSubtitle.textContent =
          'Fonctionnalité de filtre non encore disponible pour ce critère.';
        filterContainer.innerHTML =
          '<p>Veuillez sélectionner un critère de recherche valide.</p>';
        return;
      }

      // Filtrer pour n'avoir que les titres uniques et trier par ordre alphabétique
      const uniqueTitles = [...new Set(titles)].sort();

      // Afficher les filtres
      displayCheckboxes(uniqueTitles, type);
    } catch (error) {
      console.error('Erreur de chargement des données de recherche:', error);
      filterContainer.innerHTML =
        '<p>Désolé, impossible de charger les options de filtre.</p>';
    }
  }

  // 3. Fonction pour afficher la liste de checkboxes
  function displayCheckboxes(items, type) {
    if (items.length === 0) {
      filterContainer.innerHTML = `<p>Aucun(e) ${type} disponible pour le moment.</p>`;
      return;
    }

    const filterHtml = items
      .map((item) => {
        // Utilisation d'un format simple pour l'ID/Name
        const cleanId = item.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        return `
                <div class="checkbox-item">
                    <input type="checkbox" id="${type}-${cleanId}" name="${type}[]" value="${item}">
                    <label for="${type}-${cleanId}">${item}</label>
                </div>
            `;
      })
      .join('');

    // Ajout d'un bouton de validation pour le futur filtrage
    filterContainer.innerHTML = `
            <div class="checkbox-grid">
                ${filterHtml}
            </div>
            <button class="filter-submit-btn">Afficher les résultats (Bientôt)</button>
        `;
  }

  // Lancer la récupération et l'affichage des filtres
  fetchUniqueTitles(searchType);
});
